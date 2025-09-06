import { toast } from "sonner";

/**
 * Represents an item in the shopping cart.
 */
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Represents the data needed to generate a WhatsApp message for an order.
 */
interface WhatsAppMessageData {
  restaurantName: string;
  items: CartItem[];
  orderType: string;
  totalPrice: number;
}

/**
 * Generates a formatted WhatsApp message for a new order.
 *
 * @param {WhatsAppMessageData} data - The data for the order.
 * @returns {string} The formatted WhatsApp message.
 */
export const generateWhatsAppMessage = ({
  restaurantName,
  items,
  orderType,
  totalPrice,
}: WhatsAppMessageData): string => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ar-LB").format(price) + " ل.ل";
  };

  let message = `*طلب جديد من ${restaurantName}*\n\n`;
  message += `*نوع الطلب:* ${orderType}\n\n`;
  message += `*تفاصيل الطلب:*\n`;

  items.forEach((item) => {
    message += `• ${item.quantity}x ${item.name} - ${formatPrice(
      item.price * item.quantity
    )}\n`;
  });

  message += `\n*المجموع الكلي:* ${formatPrice(totalPrice)}\n\n`;
  message += `_تم إرسال هذا الطلب من خلال القائمة الرقمية_\n`;
  message += `⏰ ${new Date().toLocaleString("ar-LB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  return message;
};

/**
 * Opens WhatsApp with a pre-filled message.
 * It handles both mobile and desktop devices.
 *
 * @param {string} phoneNumber - The phone number to send the message to.
 * @param {string} message - The message to send.
 */
export const openWhatsApp = (phoneNumber: string, message: string): void => {
  // Clean phone number - remove any non-digits except +
  let cleanNumber = phoneNumber.replace(/[^\d+]/g, "");

  // Add Lebanon country code if needed
  if (!cleanNumber.startsWith("+") && !cleanNumber.startsWith("961")) {
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "961" + cleanNumber.substring(1);
    } else {
      cleanNumber = "961" + cleanNumber;
    }
  }

  // Remove + for WhatsApp URL
  if (cleanNumber.startsWith("+")) {
    cleanNumber = cleanNumber.substring(1);
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

  // Try to open WhatsApp app first, fallback to web
  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  if (isMobile) {
    toast.info("Attempting to open WhatsApp...", {
      duration: 3000,
    });

    const appUrl = `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;
    window.location.href = appUrl;

    // Fallback for when WhatsApp is not installed
    setTimeout(() => {
      // If the user is still on the page, it means WhatsApp didn't open.
      if (!document.hidden) {
        toast.error("WhatsApp not found. Opening in browser.", {
          duration: 3000,
        });
        window.open(whatsappUrl, "_blank");
      }
    }, 2500);
  } else {
    // On desktop, open web WhatsApp
    window.open(whatsappUrl, "_blank");
  }
};

/**
 * Validates a Lebanese phone number.
 *
 * @param {string} phoneNumber - The phone number to validate.
 * @returns {boolean} True if the phone number is valid, false otherwise.
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Lebanese phone number validation
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, "");

  // Check if it's a valid Lebanese number pattern
  const patterns = [
    /^\+9613\d{6}$/, // +961 3 xxxxxx (mobile)
    /^\+9617[0-6]\d{6}$/, // +961 70-76 xxxxxx (mobile)
    /^\+9618[0-1]\d{6}$/, // +961 80-81 xxxxxx (mobile)
    /^\+9611\d{6}$/, // +961 1 xxxxxx (Beirut landline)
    /^9613\d{6}$/, // 961 3 xxxxxx
    /^9617[0-6]\d{6}$/,
    /^9618[0-1]\d{6}$/,
    /^9611\d{6}$/,
    /^03\d{6}$/, // 03 xxxxxx
    /^7[0-6]\d{6}$/, // 70-76 xxxxxx
    /^8[0-1]\d{6}$/, // 80-81 xxxxxx
    /^01\d{6}$/, // 01 xxxxxx (Beirut)
  ];

  return patterns.some((pattern) => pattern.test(cleanNumber));
};