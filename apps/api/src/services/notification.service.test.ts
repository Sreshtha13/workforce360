import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRepo, mockSendEmail } = vi.hoisted(() => ({
  mockRepo: {
    findPreference: vi.fn(),
    create: vi.fn(),
    findUserEmail: vi.fn(),
    updateEmailSentAt: vi.fn(),
  },
  mockSendEmail: vi.fn(),
}));

vi.mock("../repositories/notification.repository", () => ({
  NotificationRepository: vi.fn(function () {
    return mockRepo;
  }),
}));

vi.mock("../lib/email", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock("../lib/audit", () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { NotificationService, shouldSendEmail } from "../services/notification.service";

describe("notification preference email opt-out", () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotificationService();
  });

  it("shouldSendEmail returns false when preference disables email", () => {
    expect(shouldSendEmail({ emailEnabled: false })).toBe(false);
    expect(shouldSendEmail({ emailEnabled: true })).toBe(true);
    expect(shouldSendEmail(null)).toBe(true);
  });

  it("skips email when preference emailEnabled is false", async () => {
    mockRepo.findPreference.mockResolvedValue({
      emailEnabled: false,
      inAppEnabled: true,
    });
    mockRepo.create.mockResolvedValue({
      id: "n1",
      userId: "u1",
      title: "Hello",
      message: "World",
    });

    await service.createInApp({
      userId: "u1",
      title: "Hello",
      message: "World",
      category: "TICKET",
      sendEmail: true,
    });

    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("sends email when preference allows it", async () => {
    mockRepo.findPreference.mockResolvedValue({
      emailEnabled: true,
      inAppEnabled: true,
    });
    mockRepo.create.mockResolvedValue({
      id: "n1",
      userId: "u1",
      title: "Hello",
      message: "World",
    });
    mockRepo.findUserEmail.mockResolvedValue({ id: "u1", email: "u1@example.com" });
    mockSendEmail.mockResolvedValue({ sent: false, mode: "console" });
    mockRepo.updateEmailSentAt.mockResolvedValue({});

    await service.createInApp({
      userId: "u1",
      title: "Hello",
      message: "World",
      category: "TICKET",
    });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "u1@example.com", subject: "Hello" }),
    );
  });
});
