import {
  RequestOptions as RequestComposeOptions,
} from 'request-compose'

// ----------------------------------------------------------------------------

/**
 * Grant options
 */
export interface GrantOptions {
  /**
   * Handler name
   */
  handler?: 'express' | 'koa' | 'hapi' | 'fastify' | 'curveball' |
            'node' | 'aws' | 'azure' | 'gcloud' | 'vercel'
  /**
   * Grant configuration
   */
  config?: GrantConfig
  /**
   * HTTP client options
   */
  request?: RequestComposeOptions
  /**
   * Grant session options
   */
  session?: GrantSessionConfig
  // exclude
  defaults?: never
}

/**
 * Grant config
 */
export interface GrantConfig {
  /**
   * Default configuration for all providers
   */
  defaults?: GrantProvider
  /**
   * Provider configuration
   */
  [provider: string]: GrantProvider | undefined
  // exclude
  handler?: never
  config?: never
  request?: never
  session?: never
}

/**
 * Grant provider
 */
export interface GrantProvider {
  // Authorization Server

  /**
   * OAuth 1.0a only, first step
   */
  request_url?: string
  /**
   * OAuth 2.0 first step, OAuth 1.0a second step
   */
  authorize_url?: string
  /**
   * OAuth 2.0 second step, OAuth 1.0a third step
   */
  access_url?: string
  /**
   * OAuth version number
   */
  oauth?: number
  /**
   * String delimiter used for concatenating multiple scopes
   */
  scope_delimiter?: string
  /**
   * Authentication method for the token endpoint
   */
  token_endpoint_auth_method?: string
  /**
   * Signing algorithm for the token endpoint
   */
  token_endpoint_auth_signing_alg?: string

  // Client Server

  /**
   * Where your client server can be reached
   */
  origin?: string
  /**
   * Path prefix for the Grant internal routes
   */
  prefix?: string
  /**
   * Random state string for OAuth 2.0
   */
  state?: boolean | string
  /**
   * Random nonce string for OpenID Connect
   */
  nonce?: boolean | string
  /**
   * Toggle PKCE support
   */
  pkce?: boolean
  /**
   * Response data to receive
   */
  response?: string[]
  /**
   * Transport type to deliver the response data
   */
  transport?: string
  /**
   * Relative or absolute URL to receive the response data
   */
  callback?: string
  /**
   * Static configuration overrides for a provider
   */
  overrides?: {
    [key: string]: Omit<GrantProvider, 'overrides'>
  }
  /**
   * Configuration keys that can be overridden dynamically over HTTP
   */
  dynamic?: boolean | string[]

  // Client App

  /**
   * The client_id or consumer_key of your OAuth app
   */
  key?: string
  /**
   * The client_id or consumer_key of your OAuth app
   */
  client_id?: string
  /**
   * The client_id or consumer_key of your OAuth app
   */
  consumer_key?: string
  /**
   * The client_secret or consumer_secret of your OAuth app
   */
  secret?: string
  /**
   * The client_secret or consumer_secret of your OAuth app
   */
  client_secret?: string
  /**
   * The client_secret or consumer_secret of your OAuth app
   */
  consumer_secret?: string
  /**
   * List of scopes to request
   */
  scope?: string | string[]
  /**
   * Custom authorization parameters and their values
   */
  custom_params?: any
  /**
   * String to embed into the authorization server URLs
   */
  subdomain?: string
  /**
   * Public PEM or JWK
   */
  public_key?: any
  /**
   * Private PEM or JWK
   */
  private_key?: any
  /**
   * Absolute redirect URL of the OAuth app
   */
  redirect_uri?: string
  /**
   * User profile URL
   */
  profile_url?: string
}

/**
 * Grant session config
 */
export interface GrantSessionConfig {
  /**
   * Cookie name
   */
  name?: string
  /**
   * Cookie secret
   */
  secret: string
  /**
   * Cookie options
   */
  cookie?: any
  /**
   * Session store
   */
  store?: GrantSessionStore
}

/**
 * Grant session store
 */
export interface GrantSessionStore {
  /**
   * Get item from session store
   */
  get: (sid: string) => any
  /**
   * Set item in session store
   */
  set: (sid: string, json: any) => void
  /**
   * Remove item from session store
   */
  remove?: (sid: string) => void
}

// ----------------------------------------------------------------------------

/**
 * Grant instance
 */
export interface GrantInstance {
  /**
   * Grant instance configuration
   */
  config: any
}

/**
 * Grant handler
 */
export type GrantHandler = (
  /**
   * Request object
   */
  req: any,
  /**
   * Response object
   */
  res?: any,
  /**
   * Grant dynamic state overrides
   */
  state?: {dynamic: GrantProvider}
) => Promise<GrantHandlerResult>

/**
 * Grant handler result
 */
export interface GrantHandlerResult {
  /**
   * Grant session store instance
   */
  session: GrantSessionStore
  /**
   * HTTP redirect
   */
  redirect?: any
  /**
   * Grant response
   */
  response?: GrantResponse
}

// ----------------------------------------------------------------------------

/**
 * Grant session
 */
export interface GrantSession {
  /**
   * The provider name used for this authorization
   */
  provider: string
  /**
   * The static override name used for this authorization
   */
  override?: string
  /**
   * The dynamic override configuration passed to this authorization
   */
  dynamic?: any
  /**
   * OAuth 2.0 state string that was generated
   */
  state?: string
  /**
   * OpenID Connect nonce string that was generated
   */
  nonce?: string
  /**
   * The code verifier that was generated for PKCE
   */
  code_verifier?: string
  /**
   * Data returned from the first request of the OAuth 1.0a flow
   */
  request?: string
  /**
   * The final response data
   */
  response?: GrantResponse
}

/**
 * Grant response
 */
export interface GrantResponse {
  /**
   * OAuth 2.0 and OAuth 1.0a access secret
   */
  access_token?: string
  /**
   * OAuth 2.0 refresh token
   */
  refresh_token?: string
  /**
   * OpenID Connect id token
   */
  id_token?: string
  /**
   * OAuth 1.0a access secret
   */
  access_secret?: string
  /**
   * Raw response data
   */
  raw?: any
  /**
   * Parsed id_token JWT
   */
  jwt?: {
    id_token?: {header: any, payload: any, signature: string}
  }
  /**
   * User profile response
   */
  profile?: any
  /**
   * Error response
   */
  error?: any
}

// ----------------------------------------------------------------------------

/**
 * Express middleware
 */
export type ExpressMiddleware = () => Promise<void>
/**
 * Koa middleware
 */
export type KoaMiddleware = (ctx: any, next?: () => Promise<void>) => Promise<void>
/**
 * Hapi middleware
 */
export interface HapiMiddleware {register: (server: any, options?: any) => void, pkg: any}
/**
 * Fastify middleware
 */
export type FastifyMiddleware = (server: any, options: any, next: () => void) => void
/**
 * Curveball middleware
 */
export type CurveballMiddleware = (ctx: any, next?: () => Promise<void>) => Promise<void>

// ----------------------------------------------------------------------------

/**
 * Grant OAuth Proxy
 */
declare function grant(): (config: GrantConfig | GrantOptions) => any
declare function grant(config: GrantConfig | GrantOptions): any

/**
 * Grant OAuth Proxy
 */
declare namespace grant {
  /**
   * Express handler
   */
  function express(): (config: GrantConfig | GrantOptions) => ExpressMiddleware & GrantInstance
  function express(config: GrantConfig | GrantOptions): ExpressMiddleware & GrantInstance
  /**
   * Koa handler
   */
  function koa(): (config: GrantConfig | GrantOptions) => KoaMiddleware & GrantInstance
  function koa(config: GrantConfig | GrantOptions): KoaMiddleware & GrantInstance
  /**
   * Hapi handler
   */
  function hapi(): (config: GrantConfig | GrantOptions) => HapiMiddleware & GrantInstance
  function hapi(config: GrantConfig | GrantOptions): HapiMiddleware & GrantInstance
  /**
   * Fastify handler
   */
  function fastify(): (config: GrantConfig | GrantOptions) => FastifyMiddleware & GrantInstance
  function fastify(config: GrantConfig | GrantOptions): FastifyMiddleware & GrantInstance
  /**
   * Curveball handler
   */
  function curveball(): (config: GrantConfig | GrantOptions) => CurveballMiddleware & GrantInstance
  function curveball(config: GrantConfig | GrantOptions): CurveballMiddleware & GrantInstance
  /**
   * Node handler
   */
  function node(): (config: GrantConfig | GrantOptions) => GrantHandler & GrantInstance
  function node(config: GrantConfig | GrantOptions): GrantHandler & GrantInstance
  /**
   * AWS Lambda handler
   */
  function aws(): (config: GrantConfig | GrantOptions) => GrantHandler & GrantInstance
  function aws(config: GrantConfig | GrantOptions): GrantHandler & GrantInstance
  /**
   * Azure Function handler
   */
  function azure(): (config: GrantConfig | GrantOptions) => GrantHandler & GrantInstance
  function azure(config: GrantConfig | GrantOptions): GrantHandler & GrantInstance
  /**
   * Google Cloud Function handler
   */
  function gcloud(): (config: GrantConfig | GrantOptions) => GrantHandler & GrantInstance
  function gcloud(config: GrantConfig | GrantOptions): GrantHandler & GrantInstance
  /**
   * Vercel Function handler
   */
  function vercel(): (config: GrantConfig | GrantOptions) => GrantHandler & GrantInstance
  function vercel(config: GrantConfig | GrantOptions): GrantHandler & GrantInstance
}

export default grant
