import { useOrdersStore } from '../../stores/orders.store';
import { ServiceFeedbackSheet } from './ServiceFeedbackSheet';

// Mounted once at the app shell. Watches the completed-service feedback queue
// and surfaces the emotion-aware prompt the moment a service is delivered,
// wherever the guest happens to be.
export function ServiceFeedbackHost() {
  const queue = useOrdersStore((s) => s.feedbackQueue);
  const submitServiceFeedback = useOrdersStore((s) => s.submitServiceFeedback);
  const dismissFeedback = useOrdersStore((s) => s.dismissFeedback);

  const order = queue[0] ?? null;

  return (
    <ServiceFeedbackSheet
      order={order}
      onSubmit={submitServiceFeedback}
      onDismiss={() => {
        if (order) dismissFeedback(order.id);
      }}
    />
  );
}
