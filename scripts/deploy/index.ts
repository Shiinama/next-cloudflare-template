import 'dotenv/config'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PROJECT_NAME = process.env.PROJECT_NAME || 'next-template'

const environments = [
  'AUTH_SECRET',
  'AUTH_GOOGLE_ID',
  'AUTH_GOOGLE_SECRET',
  'AUTH_RESEND_KEY',
  'AUTH_TRUST_HOST',
  'GMI_API_KEY',
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_ADMIN_ID',
  'NEXT_PUBLIC_R2_DOMAIN',
  'ELEVENLABS_API_KEY'
]

/**
 * 验证必要的环境变量
 */
const validateEnvironment = () => {
  const missing = environments.filter((varName) => !process.env[varName])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

/**
 * 迁移数据库
 */
const migrateDatabase = () => {
  console.log('📝 Migrating remote database...')
  try {
    execSync('pnpm run db:migrate-remote', { stdio: 'inherit' })
    console.log('✅ Database migration completed successfully')
  } catch (error) {
    console.error('❌ Database migration failed:', error)
    throw error
  }
}

const pushWorkerSecret = () => {
  console.log('🔐 Pushing environment secrets to Pages...')

  try {
    // 确保.env文件存在
    if (!existsSync(resolve('.env'))) {
      setupEnvFile()
    }

    // 创建一个临时文件，只包含运行时所需的环境变量
    const envContent = readFileSync(resolve('.env'), 'utf-8')
    const runtimeEnvFile = resolve('.env.runtime')

    // 从.env文件中提取运行时变量
    const runtimeEnvContent = envContent
      .split('\n')
      .filter((line) => {
        const trimmedLine = line.trim()
        // 跳过注释和空行
        if (!trimmedLine || trimmedLine.startsWith('#')) return false

        // 检查是否为运行时所需的环境变量
        for (const varName of environments) {
          if (line.startsWith(`${varName} =`) || line.startsWith(`${varName}=`)) {
            return true
          }
        }
        return false
      })
      .join('\n')

    // 写入临时文件
    writeFileSync(runtimeEnvFile, runtimeEnvContent)

    // 使用临时文件推送secrets
    execSync(`pnpm dlx wrangler secret bulk ${runtimeEnvFile} --name ${PROJECT_NAME}`, { stdio: 'inherit' })

    // 清理临时文件
    execSync(`rm ${runtimeEnvFile}`, { stdio: 'inherit' })

    console.log('✅ Secrets pushed successfully')
  } catch (error) {
    console.error('❌ Failed to push secrets:', error)
    throw error
  }
}

/**
 * 部署Pages应用
 */
const deployWorkers = () => {
  console.log('🚧 Deploying to Cloudflare Pages...')
  try {
    execSync('pnpm run deploy', { stdio: 'inherit' })
    console.log('✅ Pages deployment completed successfully')
  } catch (error) {
    console.error('❌ Pages deployment failed:', error)
    throw error
  }
}

/**
 * 创建或更新环境变量文件
 */
const setupEnvFile = () => {
  console.log('📄 Setting up environment file...')
  const envFilePath = resolve('.env')
  const envExamplePath = resolve('.env.example')

  // 如果.env文件不存在，则从.env.example复制创建
  if (!existsSync(envFilePath) && existsSync(envExamplePath)) {
    console.log('⚠️ .env file does not exist, creating from example...')

    // 从示例文件复制
    let envContent = readFileSync(envExamplePath, 'utf-8')

    // 填充当前的环境变量
    const envVarMatches = envContent.match(/^([A-Z_]+)\s*=\s*".*?"/gm)
    if (envVarMatches) {
      for (const match of envVarMatches) {
        const varName = match.split('=')[0].trim()
        if (process.env[varName]) {
          const regex = new RegExp(`${varName}\\s*=\\s*".*?"`, 'g')
          envContent = envContent.replace(regex, `${varName} = "${process.env[varName]}"`)
        }
      }
    }

    writeFileSync(envFilePath, envContent)
    console.log('✅ .env file created from example')
  } else if (existsSync(envFilePath)) {
    console.log('✨ .env file already exists')
  } else {
    console.error('❌ .env.example file not found!')
    throw new Error('.env.example file not found')
  }
}

/**
 * 主函数
 */
const main = async () => {
  try {
    console.log('🚀 Starting deployment process...')

    validateEnvironment()
    setupEnvFile()
    migrateDatabase()
    await pushWorkerSecret()
    deployWorkers()

    console.log('🎉 Deployment completed successfully')
  } catch (error) {
    console.error('❌ Deployment failed:', error)
    process.exit(1)
  }
}

main()
