/**
 * @Purpose: Generate API interface script from Swagger document
 * @Author: zhanglei
 * @Date: 2025-07-25 12:03:20
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-07-25 14:15:45
 */

/**
 * @Purpose: Generate API interface script from Swagger document (lightweight optimized version)
 * @Author: zhanglei
 * @Date: 2025-07-25 15:50:00
 */

import * as fs from 'fs'
import * as path from 'path'
import * as http from 'http'
import * as https from 'https'
import { URL } from 'url'

// Configuration type definition
interface Config {
  swaggerSource: string
  isLocalFile: boolean
  outputDir: string
  apiType: 'typescript' | 'javascript'
  headers: Record<string, string>
}

// Request configuration type
interface RequestConfig {
  timeout?: number
  headers?: Record<string, string>
  [key: string]: any
}

// Configuration
const config: Config = {
  // Swagger document URL or local file path
  swaggerSource: path.resolve(process.cwd(), './scripts/swagger.json'),

  // If swaggerSource is a local file, set to true
  isLocalFile: true,

  // Output directory
  outputDir: path.resolve(process.cwd(), './src/api'), // Make sure the output goes to the frontend/src/api directory

  // API type
  apiType: 'typescript', // 'typescript' or 'javascript'

  // Request header
  headers: {
    Accept: 'application/json',
  },
}

// Chinese tags are mapped to English (humpback)
const tagMapping: Record<string, string> = {
  认证: 'auth',
  云端: 'cloud',
  设备: 'device',
  存储: 'storage',
  系统: 'system',
  用户: 'user',
  webrtc: 'webrtc', // Already in English, remain unchanged
}
// All data types
const typeMapping: Record<string, string> = {}
// Turn the hump
const toCamel = (s: string) => {
  if (!s) {
    return ''
  }
  return s
    .split('.')
    .map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join('')
}

// Get Swagger documentation
function getSwaggerDoc(): Promise<any> {
  return new Promise((resolve, reject) => {
    // If it is a local file
    if (config.isLocalFile) {
      try {
        const content = fs.readFileSync(config.swaggerSource, 'utf8')
        resolve(JSON.parse(content))
      } catch (error: any) {
        reject(`Failed to read local file: ${error.message}`)
      }
      return
    }

    // Otherwise get from URL
    const parsedUrl = new URL(config.swaggerSource)
    const protocol = parsedUrl.protocol === 'https:' ? https : http

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: config.headers,
    }

    const req = protocol.request(options, res => {
      // Check status code
      if (res.statusCode !== 200) {
        reject(`Failed to get Swagger document, status code: ${res.statusCode}`)
        return
      }

      // Check content type
      const contentType = res.headers['content-type'] || ''
      if (!contentType.includes('application/json')) {
        reject(
          `Failed to get Swagger document, non-JSON response, type: ${contentType}`
        )
      }

      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (error: any) {
          reject(`Failed to parse JSON: ${error.message}`)
        }
      })
    })

    req.on('error', (error: Error) => {
      reject(`Network request failed: ${error.message}`)
    })

    req.end()
  })
}

// Handle type conversion
function mapSwaggerTypeToTS(schema: any): string {
  if (!schema) return 'any'

  if (schema.$ref) {
    const parts = schema.$ref.split('/')
    return parts[parts.length - 1]
  }

  if (schema.type === 'array' && schema.items) {
    return `${mapSwaggerTypeToTS(schema.items)}[]`
  }

  switch (schema.type) {
    case 'integer':
    case 'number':
      return 'number'
    case 'string':
      return 'string'
    case 'boolean':
      return 'boolean'
    case 'object':
      if (schema.additionalProperties) {
        return `Record<string, ${mapSwaggerTypeToTS(schema.additionalProperties)}>`
      }
      return 'Record<string, any>'
    default:
      return 'any'
  }
}

// Extract path parameters
function generatePathParams(path: string): string[] {
  const params: string[] = []
  const regex = /{([^}]+)}/g
  let match

  while ((match = regex.exec(path)) !== null) {
    params.push(match[1])
  }

  return params
}

// Generate TypeScript interface
function generateTypeScriptInterfaces(
  definitions: Record<string, any> | undefined
): string {
  let code = `/**
 * Automatically generated TypeScript interface - ${new Date().toISOString().split('T')[0]}
 * Generated from ${config.swaggerSource}
 */\n\n`

  for (const [name, schema] of Object.entries(definitions || {})) {
    if (schema.properties) {
      // Process interface names to ensure compliance with TypeScript naming conventions
      const safeName = toCamel(name)
      typeMapping[name] = safeName
      code += `export interface ${safeName} {\n`

      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        const required =
          schema.required && schema.required.includes(propName) ? '' : '?'
        const type = mapSwaggerTypeToTS(propSchema)
        code += `  ${propName}${required}: ${type};\n`
      }

      code += `}\n\n`
    }
  }
  return code
}

// Get the type reference of the request parameter
function getRequestTypeRef(operation: any): string | null {
  if (!operation || !operation.parameters) return null

  // Find the schema in the body parameter
  const bodyParam = operation.parameters.find(
    (p: any) => p.in === 'body' && p.schema && p.schema.$ref
  )
  if (bodyParam && bodyParam.schema.$ref) {
    // Extract kvm.CloudRegisterRequest from #/definitions/kvm.CloudRegisterRequest
    const refType = bodyParam.schema.$ref.replace('#/definitions/', '')
    if (typeMapping[refType]) {
      return refType
    } else {
      console.log(
        `\u26A0\uFE0F Warning: Request type mapping not found: ${refType}`
      )
    }
  }
  return null
}

// Get response type reference
function getResponseTypeRef(operation: any): string | null {
  if (!operation || !operation.responses || !operation.responses['200'])
    return null

  const successResponse = operation.responses['200']
  if (successResponse.schema && successResponse.schema.$ref) {
    const refType = successResponse.schema.$ref.replace('#/definitions/', '')
    if (typeMapping[refType]) {
      return refType
    } else {
      console.log(
        `\u26A0\uFE0F Warning: Response type mapping not found: ${refType}`
      )
    }
  }
  return null
}

// Generate API methods
function generateApiMethods(
  paths: Record<string, any> | undefined,
  basePath: string = ''
): { apiMethods: string; methodsByTag: Record<string, any[]> } {
  let code = ''

  // Methods to generate each module of API
  const methodsByTag: Record<string, any[]> = {}

  // Group by tag
  for (const [path, methods] of Object.entries(paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!operation) continue
      if (!(operation as any).operationId) {
        ;(operation as any).operationId =
          `${method}${path.replace(/[^a-zA-Z0-9]/g, '')}`
      }

      // Extract request and response types
      const requestTypeRef = getRequestTypeRef(operation)
      const responseTypeRef = getResponseTypeRef(operation)

      // Save type information
      ;(operation as any).requestTypeRef = requestTypeRef
      ;(operation as any).responseTypeRef = responseTypeRef

      const tag =
        ((operation as any).tags && (operation as any).tags[0]) || 'default'

      if (!methodsByTag[tag]) {
        methodsByTag[tag] = []
      }

      methodsByTag[tag].push({
        path,
        method,
        operationId: (operation as any).operationId,
        summary: (operation as any).summary || 'No description',
        requestTypeRef,
        responseTypeRef,
      })
    }
  }

  // Instead of adding the import here, we append in the main function

  // Generate APIs for each module
  for (const [tag, operations] of Object.entries(methodsByTag)) {
    // Convert Chinese labels to English and keep camel case naming
    const safeTag =
      tagMapping[tag] || tag.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')

    code += `\n// ${tag} module API\n`
    code += `export const ${safeTag}Api = {\n`

    for (const op of operations) {
      console.log('op', op)
      const requestType = toCamel(op.requestTypeRef)
      const responseType = toCamel(op.responseTypeRef)
      const pathParams = generatePathParams(op.path)
      const fullPath = `${basePath}${op.path}`
      let paramList = ''
      let urlCode = ''
      let returnType = `Promise<${responseType}>` // Default return type
      //requestTypeRef

      // Processing parameters
      if (pathParams.length > 0) {
        paramList = pathParams.map(p => `${p}: string`).join(', ')
        if (op.method.toLowerCase() !== 'get') {
          paramList += paramList
            ? `, data: ${requestType}`
            : `data: ${requestType}`
        }
        urlCode = `\`${fullPath.replace(/\{([^}]+)\}/g, (_, p) => `\${${p}}`)}\``
      } else {
        if (op.method.toLowerCase() !== 'get' && requestType) {
          paramList = `data: ${requestType}`
        }
        urlCode = `'${fullPath}'`
      }

      // Whether to use environment parameters
      if (paramList) {
        paramList += ', options?: RequestConfig'
      } else {
        paramList = 'options?: RequestConfig'
      }

      // Handle operation IDs to ensure compliance with JavaScript naming conventions
      const safeOperationId = op.operationId
        .replace(/\-/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .replace(/^\d+/g, m => `_${m}`)

      // Generate method
      code += `  // ${op.summary}\n`
      code += `  ${safeOperationId}: (${paramList}): ${returnType} => {\n`

      // Use request encapsulation
      switch (op.method.toLowerCase()) {
        case 'get':
          code += `    return request.get(${urlCode}, {
      params: {},
      ...options
    });\n`
          break
        case 'post':
          code += `    return request.post(${urlCode}, data, options);\n`
          break
        case 'put':
          code += `    return request.put(${urlCode}, data, options);\n`
          break
        case 'delete':
          code += `    return request.delete(${urlCode}, {
      data,
      ...options
    });\n`
          break
        default:
          code += `    return request.${op.method.toLowerCase()}(${urlCode}, data, options);\n`
      }

      code += `  },\n`
    }

    code += `};\n`
  }

  // \u7edf\u4e00\u5bfc\u51fa
  code += `\n// \u7edf\u4e00\u5bfc\u51fa\n`
  code += `export const api = {\n`
  for (const tag in methodsByTag) {
    const safeTag =
      tagMapping[tag] || tag.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
    code += `  ${safeTag}: ${safeTag}Api,\n`
  }
  code += `};\n`

  // \u8fd4\u56de\u751f\u6210\u7684API\u65b9\u6cd5\u4ee3\u7801\u548c\u6309\u6807\u7b7e\u5206\u7ec4\u7684\u65b9\u6cd5\u96c6\u5408
  return {
    apiMethods: code,
    methodsByTag,
  }
}

// Generate helper function
function generateHelperFunctions(): string {
  return `export const getBaseUrl = (env: string = 'local'): string => {
  switch (env) {
    case 'cloud':
      return process.env.NODE_ENV === 'production' ? '/api' : 'https://api.cloud.example.com';
    case 'local':
    default:
      return process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8080';
  }
};`
}

// save file
function saveToFile(filename: string, content: string): void {
  const filePath = path.join(config.outputDir, filename)

  // Make sure the directory exists
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true })
  }

  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`✅ Generated: ${filePath}`)
}

async function main(): Promise<void> {
  console.log(`🚀 Start generating API...`)
  try {
    // Get Swagger documentation
    console.log(
      `📦 Get Swagger document from ${config.isLocalFile ? 'local file' : 'URL'}: ${config.swaggerSource}`
    )
    const swagger = await getSwaggerDoc()
    console.log(
      `✅ Get success! API name: ${swagger.info?.title || 'Untitled'}, version: ${swagger.info?.version || 'Unknown'}`
    )

    // First generate the type interface to ensure that typeMapping is filled in
    console.log('🔨 Generate TypeScript interface...')
    const interfaces = generateTypeScriptInterfaces(swagger.definitions)
    saveToFile('types.ts', interfaces)

    // Output the generated type mapping information
    console.log(
      `✅ Generated type mapping: ${Object.keys(typeMapping).length} types`
    )
    console.log('Type mapping dictionary:', typeMapping)

    // Then generate API methods, using the populated typeMapping
    console.log('🔨 Generate API methods...')
    const { apiMethods, methodsByTag } = generateApiMethods(
      swagger.paths,
      swagger.basePath || ''
    )

    // Build export part
    const exportCode = Object.keys(methodsByTag)
      .map((tag: string) => {
        const safeTag =
          tagMapping[tag] || tag.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
        return `  ${safeTag}: ${safeTag}Api,`
      })
      .join('\n')

    // Generate complete API file content, including header comments, imports, API methods and unified exports
    const apiCode = `/**
 * Automatically generated API module - ${new Date().toISOString().split('T')[0]}
 * Generated from ${config.swaggerSource}
 */

import { request, RequestConfig } from "./request";
import { ${Object.values(typeMapping).join(', ')} } from "./types";

${apiMethods}

export default api;`

    saveToFile('api.ts', apiCode)

    // Generate utility functions
    if (config.apiType === 'typescript') {
      console.log(`🔨 Generate utility functions...`)
      saveToFile('utils.ts', generateHelperFunctions())
    }

    console.log(`✨ All API files generated successfully!`)
  } catch (error: any) {
    console.error(`❌ Generate API failed: ${error}`)
  }
}

// Execute main function
main()
