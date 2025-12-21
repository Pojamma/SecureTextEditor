/**
 * Google API Client Library TypeScript Declarations
 */

declare namespace gapi {
  function load(apiName: string, callback: () => void): void;

  namespace client {
    function init(config: {
      apiKey: string;
      clientId: string;
      discoveryDocs: string[];
      scope: string;
    }): Promise<void>;

    namespace drive {
      namespace files {
        function list(params: {
          pageSize?: number;
          fields?: string;
          q?: string;
          orderBy?: string;
        }): Promise<{
          result: {
            files?: Array<{
              id: string;
              name: string;
              mimeType: string;
              modifiedTime: string;
              size?: string;
            }>;
          };
        }>;

        function get(params: {
          fileId: string;
          alt?: string;
        }): Promise<{
          body: string;
          result?: any;
        }>;

        function create(params: {
          resource: any;
          media: any;
          fields?: string;
        }): Promise<{ result: { id: string } }>;

        function update(params: {
          fileId: string;
          resource?: any;
          media?: any;
        }): Promise<any>;

        function remove(params: { fileId: string }): Promise<any>;
      }
    }
  }

  namespace auth2 {
    function getAuthInstance(): GoogleAuth;

    interface GoogleAuth {
      signIn(): Promise<GoogleUser>;
      signOut(): Promise<void>;
      currentUser: {
        get(): GoogleUser;
      };
    }

    interface GoogleUser {
      getAuthResponse(includeAuthorizationData?: boolean): {
        access_token: string;
        refresh_token?: string;
        expires_at: number;
        expires_in: number;
      };
      reloadAuthResponse(): Promise<{
        access_token: string;
        expires_at: number;
      }>;
    }
  }
}

declare const gapi: typeof gapi;
