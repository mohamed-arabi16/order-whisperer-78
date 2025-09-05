import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart, Vegan, Flame } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { motion, AnimatePresence } from "framer-motion";
import { VscFlame } from "@/components/icons/VscFlame";
import { VscVm } from "@/components/icons/VscVm";

const demoItems = [
  {
    id: 1,
    name: "شيش طاووق",
    nameEn: "Chicken Shish Tawook",
    description: "قطع دجاج مشوية مع الخضار والأرز",
    descriptionEn: "Grilled chicken pieces with vegetables and rice",
    price: 45000,
    image:
      "https://images.unsplash.com/photo-1633945274417-b5a8ac5e2a2a?w=300&h=200&fit=crop",
    dietary_preferences: ['spicy'],
  },
  {
    id: 2,
    name: "فتوش",
    nameEn: "Fattoush Salad",
    description: "سلطة لبنانية تقليدية مع الخضار الطازجة",
    descriptionEn: "Traditional Lebanese salad with fresh vegetables",
    price: 25000,
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop",
    dietary_preferences: ['vegetarian', 'gluten-free'],
  },
  {
    id: 3,
    name: "حمص بالطحينة",
    nameEn: "Hummus with Tahini",
    description: "حمص كريمي مع طحينة وزيت الزيتون",
    descriptionEn: "Creamy hummus with tahini and olive oil",
    price: 18000,
    image:
      "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300&h=200&fit=crop",
    dietary_preferences: ['vegetarian'],
  },
];

/**
 * An interactive demonstration of the menu and ordering system.
 * It displays a list of demo menu items, allows users to add/remove them from a cart,
 * and simulates sending an order via WhatsApp.
 * It uses the `useTranslation` hook for localization and `framer-motion` for animations.
 *
 * @returns {JSX.Element} The rendered menu demo section.
 */
const MenuDemo = (): JSX.Element => {
  const { t, isRTL } = useTranslation();
  const [cart, setCart] = useState<
    { id: number; name: string; price: number; quantity: number }[]
  >([]);

  const addToCart = (item: (typeof demoItems)[0]) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.id === item.id
      );
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [
          ...prevCart,
          {
            id: item.id,
            name: isRTL ? item.name : item.nameEn,
            price: item.price,
            quantity: 1,
          },
        ];
      }
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((cartItem) =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      } else {
        return prevCart.filter((cartItem) => cartItem.id !== itemId);
      }
    });
  };

  const getQuantity = (itemId: number) => {
    return cart.find((cartItem) => cartItem.id === itemId)?.quantity || 0;
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSendWhatsApp = () => {
    const restaurantPhoneNumber = "9611234567"; // Placeholder phone number
    let message = `${t("menuDemo.cartTitle")}\n\n`;
    cart.forEach((item) => {
      message += `${item.name} x${
        item.quantity
      } - ${item.price.toLocaleString()} ${t("currency")}\n`;
    });
    message += `\n${t("menuDemo.total")}: ${total.toLocaleString()} ${t(
      "currency"
    )}`;

    const whatsappUrl = `https://wa.me/${restaurantPhoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <section
      id="demo"
      className="py-16 px-4 bg-secondary/10"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t("menuDemo.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("menuDemo.subtitle")}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {demoItems.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden shadow-card transition-all duration-300 hover:shadow-lg flex flex-col md:flex-row md:items-center"
              >
                <img
                  src={item.image}
                  alt={isRTL ? item.name : item.nameEn}
                  className="w-full h-40 md:w-32 md:h-32 object-cover"
                />
                <CardContent className="p-4 flex flex-col flex-grow justify-between">
                  <div>
                    <h4 className="font-bold text-lg text-foreground">
                      {isRTL ? item.name : item.nameEn}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {isRTL ? item.description : item.descriptionEn}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {item.dietary_preferences?.includes('vegetarian') && (
                        <VscVm className="h-5 w-5 text-green-600" />
                      )}
                      {item.dietary_preferences?.includes('spicy') && (
                        <VscFlame className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-lg font-semibold text-primary">
                      {item.price.toLocaleString()} {t("currency")}
                    </p>
                    <div className="flex items-center gap-2">
                      {getQuantity(item.id) > 0 && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.id)}
                            className="h-9 w-9 p-0 rounded-full"
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="text-base font-bold min-w-[2rem] text-center">
                            {getQuantity(item.id)}
                          </span>
                        </>
                      )}
                      <Button
                        size="sm"
                        onClick={() => addToCart(item)}
                        className="h-9 w-9 p-0 rounded-full"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <ShoppingCart size={20} /> {t("menuDemo.cartTitle")}
                </h3>
                <AnimatePresence>
                  <motion.div layout className="space-y-3">
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex justify-between items-center text-sm"
                      >
                        <span>
                          {item.name} x{item.quantity}
                        </span>
                        <span className="font-medium">
                          {(item.price * item.quantity).toLocaleString()}{" "}
                          {t("currency")}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
                {cart.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    {t("menuDemo.cartEmpty")}
                  </p>
                )}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between mb-4 font-bold text-lg">
                    <span>{t("menuDemo.total")}</span>
                    <span>
                      {total.toLocaleString()} {t("currency")}
                    </span>
                  </div>
                  <Button
                    className="w-full gradient-hero text-primary-foreground"
                    disabled={cart.length === 0}
                    onClick={handleSendWhatsApp}
                  >
                    {t("menuDemo.whatsappButton")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenuDemo;