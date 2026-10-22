import React from "react";
import { CheckCircle2, AlertCircle, Info, Sparkles } from "lucide-react";
import { useShop } from "../context/ShopContext";

function Toast() {
  const { toast } = useShop();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle2 className="toast-icon success" size={20} />;
      case "error":
        return <AlertCircle className="toast-icon error" size={20} />;
      case "ai":
        return <Sparkles className="toast-icon ai" size={20} />;
      default:
        return <Info className="toast-icon info" size={20} />;
    }
  };

  return (
    <div className={`toast-notification ${toast.type}`}>
      {getIcon()}
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}

export default Toast;
