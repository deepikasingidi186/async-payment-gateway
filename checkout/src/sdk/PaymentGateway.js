class PaymentGateway {
  constructor(options) {
    if (!options || !options.key || !options.orderId) {
      throw new Error('key and orderId are required');
    }

    this.key = options.key;
    this.orderId = options.orderId;
    this.onSuccess = options.onSuccess || function () {};
    this.onFailure = options.onFailure || function () {};
    this.onClose = options.onClose || function () {};

    this.handleMessage = this.handleMessage.bind(this);
  }

  open() {
    // Create modal container
    this.modal = document.createElement('div');
    this.modal.id = 'payment-gateway-modal';
    this.modal.setAttribute('data-test-id', 'payment-modal');

    this.modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <iframe
            data-test-id="payment-iframe"
            src="http://localhost:3001/checkout?order_id=${this.orderId}&embedded=true"
            style="width:100%;height:400px;border:none;"
          ></iframe>
          <button
            data-test-id="close-modal-button"
            class="close-button"
          >×</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    // Close button
    this.modal.querySelector('.close-button').onclick = () => {
      this.close();
    };

    window.addEventListener('message', this.handleMessage);
  }

  handleMessage(event) {
    const { type, data } = event.data || {};

    if (type === 'payment_success') {
      this.onSuccess(data);
      this.close();
    }

    if (type === 'payment_failed') {
      this.onFailure(data);
    }

    if (type === 'close_modal') {
      this.close();
    }
  }

  close() {
    window.removeEventListener('message', this.handleMessage);
    if (this.modal) {
      document.body.removeChild(this.modal);
      this.modal = null;
    }
    this.onClose();
  }
}

// Expose globally
window.PaymentGateway = PaymentGateway;
