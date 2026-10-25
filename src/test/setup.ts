import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock HTMLCanvasElement.getContext for WebGL/2D canvas contexts in JSDOM
if (typeof window !== "undefined") {
  HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
    if (contextId === "webgl" || contextId === "webgl2" || contextId === "experimental-webgl") {
      return {
        getExtension: vi.fn(),
        getParameter: vi.fn(),
        createTexture: vi.fn(),
        bindTexture: vi.fn(),
        texParameteri: vi.fn(),
        texImage2D: vi.fn(),
        clearColor: vi.fn(),
        clear: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        viewport: vi.fn(),
        createShader: vi.fn(),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        getShaderParameter: vi.fn(() => true),
        createProgram: vi.fn(),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        getProgramParameter: vi.fn(() => true),
        useProgram: vi.fn(),
        createBuffer: vi.fn(),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
      } as unknown as WebGLRenderingContext;
    }
    return null;
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  // Mock window.matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}
