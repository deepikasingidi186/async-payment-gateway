import React from 'react';

export default function CheckoutForm() {
  const pay = () => {
    window.parent.postMessage(
      {
        type: 'payment_success',
        data: { paymentId: 'pay_demo_123' }
      },
      '*'
    );
  };

  return (
    <div>
      <h3>Demo Checkout</h3>
      <button onClick={pay}>Pay Now</button>
    </div>
  );
}
