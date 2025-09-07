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
 * It handles both mobile and desktop devices and supports international phone numbers.
 *
 * @param {string} phoneNumber - The phone number to send the message to.
 * @param {string} message - The message to send.
 */
export const openWhatsApp = (phoneNumber: string, message: string): void => {
  // Clean phone number - remove any non-digits except +
  let cleanNumber = phoneNumber.replace(/[^\d+]/g, "");

  // If number doesn't start with + and doesn't already have country code, 
  // assume it needs country code but don't hardcode Lebanon
  if (!cleanNumber.startsWith("+")) {
    // If it starts with 0, remove the leading zero
    if (cleanNumber.startsWith("0")) {
      cleanNumber = cleanNumber.substring(1);
    }
    // Don't add any country code - user should provide full international number
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
 * Validates an international phone number.
 *
 * @param {string} phoneNumber - The phone number to validate.
 * @returns {boolean} True if the phone number is valid, false otherwise.
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Universal international phone number validation
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, "");

  // Check for various international number patterns
  const patterns = [
    /^\+\d{7,15}$/, // International format: +1234567890 (7-15 digits)
    /^\d{7,15}$/, // National format: 1234567890 (7-15 digits)
  ];

  return patterns.some((pattern) => pattern.test(cleanNumber));
};