import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Header from "../../../src/components/core/Header";
import { useAuth } from "@auth/useAuth";

// Mock the auth hook
vi.mock("@auth/useAuth");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Rough.js
vi.mock("roughjs/bundled/rough.esm.js", () => ({
  default: {
    svg: vi.fn(() => ({
      line: vi.fn(() =>
        document.createElementNS("http://www.w3.org/2000/svg", "line"),
      ),
    })),
  },
}));

// Mock the roughjs utility
vi.mock("@utils/roughjs", () => ({
  roughHeaderDivider: {
    roughness: 0.8,
    stroke: "var(--brand-border)",
    strokeWidth: 1,
  },
}));

// Mock the fallback avatar utility
vi.mock("@utils/fallbackAvatar", () => ({
  getFallbackAvatar: vi.fn(() => "data:image/svg+xml;base64,mock-avatar"),
}));

describe("Header", () => {
  const mockUser = {
    uid: "test-uid",
    email: "test@example.com",
    displayName: "Test User",
    photoURL: "https://example.com/avatar.jpg",
  };

  const mockSignOut = vi.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
      signIn: vi.fn(),
      loading: false,
    });

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  const renderHeader = (props = {}) => {
    return render(
      <BrowserRouter>
        <Header {...props} />
      </BrowserRouter>,
    );
  };

  describe("Basic Rendering", () => {
    it("should render header with title", () => {
      renderHeader({ title: "Test Page" });
      expect(screen.getByText("Test Page")).toBeTruthy();
    });

    it("should render header without title", () => {
      renderHeader();
      expect(screen.getByRole("banner")).toBeTruthy();
    });

    it("should render hamburger button", () => {
      renderHeader();
      expect(screen.getByRole("button", { name: "Open sidebar" })).toBeTruthy();
    });

    it("should render user avatar", () => {
      renderHeader();
      const avatar = screen.getByAltText("User avatar");
      expect(avatar).toBeTruthy();
      expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
    });

    it("should render user menu button", () => {
      renderHeader();
      expect(screen.getByRole("button", { name: /user/i })).toBeTruthy();
    });
  });

  describe("User Menu", () => {
    it("should show user display name in menu", () => {
      renderHeader();
      const menuButton = screen.getByRole("button", { name: /user/i });
      expect(menuButton).toHaveAttribute("title", "Test User");
    });

    it("should show user email in menu", () => {
      renderHeader();
      expect(screen.getByText("test@example.com")).toBeTruthy();
    });

    it("should show Profile link in menu", () => {
      renderHeader();
      expect(screen.getByRole("menuitem", { name: "Profile" })).toBeTruthy();
    });

    it("should show Settings link in menu", () => {
      renderHeader();
      expect(screen.getByRole("menuitem", { name: "Settings" })).toBeTruthy();
    });

    it("should show Sign out button in menu", () => {
      renderHeader();
      expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeTruthy();
    });
  });

  describe("Sidebar Toggle", () => {
    it("should call onToggleSidebar when hamburger button is clicked", () => {
      const mockToggleSidebar = vi.fn();
      renderHeader({ onToggleSidebar: mockToggleSidebar });

      const hamburgerButton = screen.getByRole("button", {
        name: "Open sidebar",
      });
      hamburgerButton.click();

      expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    });
  });

  describe("Rough.js Divider", () => {
    it("should create SVG element for rough divider", () => {
      const createElementNS = vi.spyOn(document, "createElementNS");
      renderHeader();

      expect(createElementNS).toHaveBeenCalledWith(
        "http://www.w3.org/2000/svg",
        "svg",
      );
    });

    it("should set correct SVG attributes", () => {
      const createElementNS = vi.spyOn(document, "createElementNS");
      const mockSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      createElementNS.mockReturnValue(mockSvg);

      renderHeader();

      expect(mockSvg.getAttribute("width")).toBe("100%");
      expect(mockSvg.getAttribute("height")).toBe("2");
      expect(mockSvg.style.position).toBe("absolute");
      expect(mockSvg.style.bottom).toBe("0");
      expect(mockSvg.style.left).toBe("0");
      expect(mockSvg.style.pointerEvents).toBe("none");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes for user menu", () => {
      renderHeader();
      const menuButton = screen.getByRole("button", { name: /user/i });

      expect(menuButton).toHaveAttribute("aria-haspopup", "menu");
      expect(menuButton).toHaveAttribute("aria-expanded", "false");
    });

    it("should have proper role for menu dropdown", () => {
      renderHeader();
      expect(screen.getByRole("menu")).toBeTruthy();
    });

    it("should have proper role for menu items", () => {
      renderHeader();
      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems).toHaveLength(3); // Profile, Settings, Sign out
    });
  });

  describe("Error Handling", () => {
    it("should handle missing user photo URL", () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, photoURL: null },
        signOut: mockSignOut,
        signIn: vi.fn(),
        loading: false,
      });

      renderHeader();
      const avatar = screen.getByAltText("User avatar");
      expect(avatar).toBeTruthy();
    });

    it("should handle missing user display name", () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, displayName: null },
        signOut: mockSignOut,
        signIn: vi.fn(),
        loading: false,
      });

      renderHeader();
      expect(screen.getByText("User")).toBeTruthy();
    });
  });
});
