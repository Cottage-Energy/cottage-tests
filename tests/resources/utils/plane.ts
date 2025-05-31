const API_KEY = process.env.PLANE_API_KEY!;
const BASE_URL = "https://plane.public-grid.io/api/v1/workspaces/public-grid";

type PlaneResponse<T> = T;

class PlaneClient {
    private baseUrl: string;
    private apiKey: string;
  
    constructor(baseUrl: string, apiKey: string) {
      this.baseUrl = baseUrl;
      this.apiKey = apiKey;
    }
  
    private async apiCall<T>(
      method: "GET" | "POST" | "PATCH" | "DELETE",
      endpoint: string,
      body?: any,
    ): Promise<PlaneResponse<T>> {
      const url = `${this.baseUrl}${endpoint}`;
  
      const options: RequestInit = {
        method,
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };
  
      if (body) {
        options.body = JSON.stringify(body);
      }
  
      try {
        const response = await fetch(url, options);
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.detail ||
              errorData?.error ||
              `API call failed with status: ${response.status}`,
          );
        }
  
        if (response.status === 204) {
          return {} as any;
        }
  
        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`Error in ${method} ${endpoint}:`, error);
        throw error;
      }
    }
  
  
  
    //259283da-c957-40a5-88b9-0aa8d951a7b4 project id
    async deleteIssue(projectId: string, issueId: string) {
      try {
        const response = await this.apiCall<any>(
          "DELETE",
          `/projects/${projectId}/issues/${issueId}/`,
        );
  
        return response;
      } catch (error) {
        console.error("Error deleting issue", error);
        throw error;
      }
    }
  
  
    async getIssueWithState(projectId: string, issueId: string) {
      try {
        const response = await this.apiCall<any>(
          "GET",
          `/projects/${projectId}/issues/${issueId}/?expand=state`,
        );
  
        return response;
      } catch (error) {
        console.error("Error getting issue with state:", error);
        throw error;
      }
    }
  
  
}
  
const planeClient = new PlaneClient(BASE_URL, API_KEY);
  
export { planeClient };