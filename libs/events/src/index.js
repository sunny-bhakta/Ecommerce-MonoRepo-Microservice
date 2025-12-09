"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentEventNames = exports.OrderEventNames = void 0;
var OrderEventNames;
(function (OrderEventNames) {
    OrderEventNames["ORDER_CREATED"] = "order.created";
})(OrderEventNames || (exports.OrderEventNames = OrderEventNames = {}));
var PaymentEventNames;
(function (PaymentEventNames) {
    PaymentEventNames["PAYMENT_COMPLETED"] = "payment.completed";
    PaymentEventNames["PAYMENT_FAILED"] = "payment.failed";
})(PaymentEventNames || (exports.PaymentEventNames = PaymentEventNames = {}));
//# sourceMappingURL=index.js.map