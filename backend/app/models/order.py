from pydantic import BaseModel, Field
from typing import List, Optional

class OrderItem(BaseModel):
    product: str
    name: str
    quantity: int
    price: float
    image: str
    size: Optional[str] = "Unique"

class OrderCreate(BaseModel):
    items: List[OrderItem]
    totalAmount: float
    paymentMethod: str
    shippingAddress: str
    phone: str
    status: Optional[str] = "En attente"