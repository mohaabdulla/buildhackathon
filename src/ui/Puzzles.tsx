import React, { useState } from 'react';
import type { MenuItem } from '@/data/schemas';

interface MenuCipherPuzzleProps {
  restaurant: any;
  menuItems: MenuItem[];
  onSolved: (solution: string) => void;
  onClose: () => void;
}

export const MenuCipherPuzzle: React.FC<MenuCipherPuzzleProps> = ({
  restaurant,
  menuItems,
  onSolved,
  onClose
}) => {
  const [userInput, setUserInput] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  // Simple cipher: First letter of each selected dish name
  const expectedSolution = "SECRET"; // Example solution
  
  const handleItemClick = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getCurrentWord = () => {
    return selectedItems
      .map(id => menuItems.find(item => item.item_id === id)?.name[0])
      .join('')
      .toUpperCase();
  };

  const handleSubmit = () => {
    const solution = getCurrentWord();
    if (solution === expectedSolution) {
      onSolved(solution);
    } else {
      alert('Not quite right. Try selecting different dishes!');
    }
  };

  return (
    <div className="puzzle-modal">
      <div className="puzzle-content">
        <h2>Menu Cipher - {restaurant?.name}</h2>
        <p>Select dishes to form a word using the first letter of each dish name.</p>
        <p className="cipher-hint">Hint: Something you keep hidden (6 letters)</p>
        
        <div className="menu-grid">
          {menuItems.map(item => (
            <div 
              key={item.item_id}
              className={`menu-item ${selectedItems.includes(item.item_id) ? 'selected' : ''}`}
              onClick={() => handleItemClick(item.item_id)}
            >
              <strong>{item.name}</strong>
              <span className="first-letter">{item.name[0].toUpperCase()}</span>
              <p>${item.price}</p>
            </div>
          ))}
        </div>

        <div className="current-word">
          <h3>Current Word: {getCurrentWord()}</h3>
        </div>

        <div className="puzzle-actions">
          <button onClick={handleSubmit} disabled={selectedItems.length === 0}>
            Submit Solution
          </button>
          <button onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface OrderReconstructionPuzzleProps {
  orders: any[];
  orderItems: any[];
  onSolved: () => void;
  onClose: () => void;
}

export const OrderReconstructionPuzzle: React.FC<OrderReconstructionPuzzleProps> = ({
  orders,
  orderItems,
  onSolved,
  onClose
}) => {
  const [assignments, setAssignments] = useState<Record<number, number>>({});

  const handleAssignment = (itemId: number, orderId: number) => {
    setAssignments(prev => ({
      ...prev,
      [itemId]: orderId
    }));
  };

  const validateSolution = () => {
    // Check if all items are assigned correctly
    let correct = true;
    orderItems.forEach((item: any) => {
      if (assignments[item.order_item_id] !== item.order_id) {
        correct = false;
      }
    });
    
    if (correct) {
      onSolved();
    } else {
      alert('Some items are not assigned to the correct orders. Check the totals!');
    }
  };

  return (
    <div className="puzzle-modal">
      <div className="puzzle-content">
        <h2>Order Reconstruction</h2>
        <p>Match each item to the correct order based on totals and delivery details.</p>
        
        <div className="puzzle-grid">
          <div className="orders-column">
            <h3>Orders</h3>
            {orders.map(order => (
              <div key={order.order_id} className="order-card">
                <h4>Order #{order.order_id}</h4>
                <p>Total: ${order.total_amount}</p>
                <p>Address: {order.delivery_address}</p>
              </div>
            ))}
          </div>

          <div className="items-column">
            <h3>Items to Assign</h3>
            {orderItems.map((item: any) => (
              <div key={item.order_item_id} className="item-card">
                <p>{item.itemName} x{item.quantity}</p>
                <p>${item.item_price * item.quantity}</p>
                <select 
                  value={assignments[item.order_item_id] || ''}
                  onChange={(e) => handleAssignment(item.order_item_id, Number(e.target.value))}
                >
                  <option value="">Select Order</option>
                  {orders.map(order => (
                    <option key={order.order_id} value={order.order_id}>
                      Order #{order.order_id}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="puzzle-actions">
          <button onClick={validateSolution}>
            Validate Solution
          </button>
          <button onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
