import fs from 'fs'
import 'dotenv/config'
import { AnthropicProvider, createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI, OpenAIProvider } from '@ai-sdk/openai'
import { generateText, LanguageModelV1 } from 'ai'
import { Campsite } from 'campsite-client'
import jsdom from 'jsdom'

const ROLLUP_CHANNEL_ID = '95ubrnsovwd9'
const TMP_PATH = 'tmp'

type RunArgs = {
  modelProvider?: 'openai' | 'anthropic'
}

const DAILY_SUMMARY_SYSTEM_PROMPT = `You are an AI assistant integrated into a team communication platform called Campsite...` as const

function htmlToText(html: string) {
  const dom = new jsdom.JSDOM(html)
  return dom.window.document.body.textContent || '(no content found)'
}

function writeToFile(path: string, content: string) {
  if (process.env.NODE_ENV === 'production') return
  if (!fs.existsSync(TMP_PATH)) fs.mkdirSync(TMP_PATH)
  fs.writeFileSync(TMP_PATH + '/' + path, content)
}

async function getTodayPosts(campsite: Campsite) {
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  const posts = [] as any[]
  for await (const post of campsite.posts.list({ sort: 'last_activity_at' })) {
    if (new Date(post.last_activity_at) < oneDayAgo) break
    posts.push(post)
  }
  return posts
}

export async function runRollup({ modelProvider = 'anthropic' }: RunArgs) {
  const campsite = new Campsite({ apiKey: process.env.CAMPSITE_API_KEY })
  const anthropic: AnthropicProvider = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const openai: OpenAIProvider = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  const model: LanguageModelV1 = modelProvider === 'openai' ? openai('gpt-4o') : anthropic('claude-3-5-sonnet-20240620')

  const posts = await getTodayPosts(campsite)

  const postsToSummarize: string[] = []
  for (const post of posts) {
    let str = `POST TITLE: ${post.title}`
    str += `\nPOST AUTHOR: ${post.author.name}`
    str += '\nPOST CONTENT:\n```' + htmlToText(post.content) + '```'

    const root = await campsite.posts.comments.list(post.id)
    const comments: any[] = []
    let totalCount = root.data.length
    for (const comment of root.data) {
      const replies = await campsite.posts.comments.list(post.id, { parent_id: comment.id })
      totalCount += replies.data.length
      comments.push({ ...comment, replies: replies.data })
    }

    if (comments.length > 0) {
      str += `\n\nCOMMENTS: (${totalCount} total)\n\n`
      for (const comment of comments) {
        str += ` ${comment.author.name}: ${htmlToText(comment.content)}\n`
        if (comment.replies.length > 0) {
          for (const reply of comment.replies) {
            str += `  ${reply.author.name} (in reply): ${htmlToText(reply.content)}\n`
          }
        }
      }
      str += '\n'
    }

    const system = `You are an expert at summarizing posts and comments...`
    const { text } = await generateText({ model, system, messages: [{ role: 'system', content: system }, { role: 'user', content: str }] })

    const rollupSummary = `POST TITLE: ${post.title}\nPOST AUTHOR: ${post.author.name}\nPOST CHANNEL: ${post.channel.name}\nPOST URL: ${post.url}\nCOMMENTS COUNT: ${post.comments_count}\nDISCUSSION SUMMARY:\n\n${text}`
    postsToSummarize.push(rollupSummary)
  }

  const summarizedPosts = postsToSummarize.join('\n\n---\n\n')
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
  const dateStr = yesterday.toLocaleDateString().replace(/\//g, '-')
  writeToFile(`summarized-posts-${dateStr}.txt`, summarizedPosts)

  const summary = await generateText({ model, system: DAILY_SUMMARY_SYSTEM_PROMPT, prompt: summarizedPosts })

  if (process.env.NODE_ENV === 'production') {
    const finalPost = await campsite.posts.create({
      channel_id: ROLLUP_CHANNEL_ID,
      title: `Daily summary (${yesterday.toLocaleDateString()})`,
      content_markdown: summary.text
    })
    return { url: finalPost.url }
  } else {
    writeToFile(`rollup-${dateStr}.txt`, summary.text)
    return { ok: true }
  }
}

