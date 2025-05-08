import { sendSMS, checkSMSStatus, sendBulkSMS } from '../sms'
import twilio from 'twilio'
import { MessageInstance, MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message'
import { Twilio } from 'twilio'

type MockTwilioClient = {
  messages: () => {
    create: (params: MessageListInstanceCreateOptions) => Promise<MessageInstance>;
    get: (sid: string) => {
      fetch: () => Promise<MessageInstance>;
    };
  };
}

// Mock Twilio client
jest.mock('twilio', () => {
  const mockMessageContext = {
    fetch: jest.fn().mockImplementation(() => Promise.resolve({
      status: 'delivered'
    } as MessageInstance))
  }

  const mockMessages = {
    create: jest.fn().mockImplementation((params: MessageListInstanceCreateOptions) => Promise.resolve({
      sid: 'test-sid',
      status: 'sent',
      ...params
    } as MessageInstance)),
    get: jest.fn().mockReturnValue(mockMessageContext)
  }

  const mockClient = {
    messages: jest.fn(() => mockMessages)
  }

  return jest.fn(() => mockClient)
})

describe('SMS Service', () => {
  let mockTwilioClient: MockTwilioClient

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.TWILIO_PHONE_NUMBER = '+1234567890'
    mockTwilioClient = twilio() as unknown as MockTwilioClient
  })

  describe('sendSMS', () => {
    it('should send SMS successfully', async () => {
      const data = {
        to: '+905551234567',
        message: 'Test message',
      }

      await sendSMS(data)

      expect(mockTwilioClient.messages().create).toHaveBeenCalledWith({
        body: data.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: data.to,
      })
    })

    it('should throw error when Twilio phone number is not configured', async () => {
      delete process.env.TWILIO_PHONE_NUMBER

      const data = {
        to: '+905551234567',
        message: 'Test message',
      }

      await expect(sendSMS(data)).rejects.toThrow('Twilio phone number is not configured')
    })

    it('should handle Twilio API errors', async () => {
      const mockCreate = mockTwilioClient.messages().create as jest.Mock
      mockCreate.mockImplementationOnce(() => Promise.reject(new Error('API Error')))

      const data = {
        to: '+905551234567',
        message: 'Test message',
      }

      await expect(sendSMS(data)).rejects.toThrow('SMS failed')
    })
  })

  describe('checkSMSStatus', () => {
    it('should check SMS status successfully', async () => {
      const status = await checkSMSStatus('test-sid')

      expect(status).toBe('delivered')
      expect(mockTwilioClient.messages().get('test-sid').fetch).toHaveBeenCalled()
    })

    it('should handle Twilio API errors when checking status', async () => {
      const mockFetch = mockTwilioClient.messages().get('test-sid').fetch as jest.Mock
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('API Error')))

      await expect(checkSMSStatus('test-sid')).rejects.toThrow('Failed to check SMS status')
    })
  })

  describe('sendBulkSMS', () => {
    it('should send bulk SMS successfully', async () => {
      const messages = [
        {
          to: '+905551234567',
          message: 'Test message 1',
        },
        {
          to: '+905559876543',
          message: 'Test message 2',
        },
      ]

      await sendBulkSMS(messages)

      expect(mockTwilioClient.messages().create).toHaveBeenCalledTimes(2)
    })

    it('should handle partial failures in bulk SMS', async () => {
      const mockCreate = mockTwilioClient.messages().create as jest.Mock
      mockCreate
        .mockImplementationOnce(() => Promise.resolve({ sid: 'test-sid-1', status: 'sent' } as MessageInstance))
        .mockImplementationOnce(() => Promise.reject(new Error('API Error')))

      const messages = [
        {
          to: '+905551234567',
          message: 'Test message 1',
        },
        {
          to: '+905559876543',
          message: 'Test message 2',
        },
      ]

      await sendBulkSMS(messages)

      expect(mockTwilioClient.messages().create).toHaveBeenCalledTimes(2)
    })

    it('should throw error when all bulk SMS messages fail', async () => {
      const mockCreate = mockTwilioClient.messages().create as jest.Mock
      mockCreate
        .mockImplementationOnce(() => Promise.reject(new Error('API Error 1')))
        .mockImplementationOnce(() => Promise.reject(new Error('API Error 2')))

      const messages = [
        {
          to: '+905551234567',
          message: 'Test message 1',
        },
        {
          to: '+905559876543',
          message: 'Test message 2',
        },
      ]

      await expect(sendBulkSMS(messages)).rejects.toThrow('All SMS messages failed to send')
    })
  })
}) 