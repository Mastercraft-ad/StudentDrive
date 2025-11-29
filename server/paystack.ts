import { nanoid } from 'nanoid';

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    customer: {
      email: string;
      customer_code: string;
      first_name: string;
      last_name: string;
    };
    metadata: Record<string, any>;
  };
}

export interface PaystackPaymentData {
  email: string;
  amount: number;
  reference?: string;
  callback_url?: string;
  metadata?: {
    schoolId: string;
    studentId: string;
    feeTypeId: string;
    termId: string;
    paidById: string;
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
  };
}

class PaystackService {
  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.secretKey;
  }

  generateReference(): string {
    return `SD-${Date.now()}-${nanoid(8)}`;
  }

  async initializePayment(data: PaystackPaymentData): Promise<PaystackInitResponse> {
    if (!this.isConfigured()) {
      throw new Error('Paystack is not configured. Please add PAYSTACK_SECRET_KEY.');
    }

    const reference = data.reference || this.generateReference();

    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        amount: data.amount,
        reference,
        callback_url: data.callback_url,
        metadata: data.metadata,
      }),
    });

    const result = await response.json() as PaystackInitResponse;
    
    if (!response.ok || !result.status) {
      throw new Error(result.message || 'Failed to initialize payment');
    }

    return result;
  }

  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    if (!this.isConfigured()) {
      throw new Error('Paystack is not configured. Please add PAYSTACK_SECRET_KEY.');
    }

    const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json() as PaystackVerifyResponse;
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to verify payment');
    }

    return result;
  }

  validateWebhookSignature(signature: string, body: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(body)
      .digest('hex');
    return hash === signature;
  }
}

export const paystack = new PaystackService();
