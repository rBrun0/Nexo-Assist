import { describe, expect, it } from "@jest/globals";

import { formatAgentError } from "./format-agent-error";

describe("formatAgentError", () => {
  it("extrai a mensagem do Google API Call Error", () => {
    const error = Object.assign(new Error("No output generated."), {
      name: "AI_APICallError",
      statusCode: 404,
      url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent",
      data: {
        error: {
          code: 404,
          message:
            "This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash.",
          status: "NOT_FOUND",
        },
      },
    });

    expect(formatAgentError(error)).toContain("gemini-3.8-flash");
    expect(formatAgentError(error)).toContain("HTTP 404");
    expect(formatAgentError(error)).toContain("AI_APICallError");
  });

  it("percorre cause aninhada do NoOutputGeneratedError", () => {
    const cause = Object.assign(new Error("wrapper"), {
      data: {
        error: {
          message: "Modelo indisponível para novos usuários.",
        },
      },
      statusCode: 404,
    });
    const error = Object.assign(new Error("No output generated."), {
      name: "AI_NoOutputGeneratedError",
      cause,
    });

    expect(formatAgentError(error)).toContain("Modelo indisponível");
    expect(formatAgentError(error)).toContain("HTTP 404");
  });

  it("usa mensagem padrão quando o erro é opaco", () => {
    expect(formatAgentError({})).toBe(
      "Não foi possível gerar uma resposta agora. Tente novamente."
    );
  });

  it("enriquece NoOutputGeneratedError sem causa Google", () => {
    const error = Object.assign(new Error("No output generated."), {
      name: "AI_NoOutputGeneratedError",
    });

    const formatted = formatAgentError(error, {
      model: "gemini-3.8-flash",
      finishReason: "error",
      phase: "primary",
    });

    expect(formatted).toContain("não gerou texto");
    expect(formatted).toContain("gemini-3.8-flash");
    expect(formatted).toContain("thinkingLevel");
    expect(formatted).toContain("AI_NoOutputGeneratedError");
  });

  it("traduz erro de cota / rate limit do Gemini Free Tier", () => {
    const error = Object.assign(
      new Error(
        "Failed after 3 attempts. Last error: AI_APICallError: You exceeded your current quota",
      ),
      {
        name: "AI_RetryError",
        cause: Object.assign(new Error("You exceeded your current quota"), {
          name: "AI_APICallError",
          statusCode: 429,
          data: {
            error: {
              code: 429,
              message:
                "You exceeded your current quota, please check your plan and billing details. Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.8-flash",
              status: "RESOURCE_EXHAUSTED",
            },
          },
        }),
      },
    );

    const formatted = formatAgentError(error, { model: "gemini-3.8-flash" });

    expect(formatted).toContain("Cota diária do Gemini esgotada");
    expect(formatted).toContain("gemini-3.8-flash");
    expect(formatted).toContain("HTTP 429");
  });
});
