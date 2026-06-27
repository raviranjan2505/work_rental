export const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true)
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
    })
}

// order: the Razorpay order object returned by our backend ({ id, amount, currency })
// onSuccess(response): called with { razorpay_order_id, razorpay_payment_id, razorpay_signature }
export const openRazorpayCheckout = async ({ order, name, description, prefill, onSuccess, onDismiss }) => {
    const loaded = await loadRazorpayScript()
    if (!loaded) {
        alert("Could not load the payment gateway. Please check your connection and try again.")
        return
    }

    const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || "INR",
        order_id: order.id,
        name: name || "Men On Rent",
        description: description || "",
        prefill: prefill || {},
        theme: { color: "#ff4d2d" },
        handler: (response) => onSuccess(response),
        modal: { ondismiss: () => onDismiss && onDismiss() }
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
}
