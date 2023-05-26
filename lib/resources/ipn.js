const requestManager = require("../request-manager");
const preapprovalModule = require("./preapproval");
const merchantOrdersModule = require("./merchantOrders");
const MercadopagoIpnResponse = require("../utils/mercadopagoIpnResponse");
const Promise = require("bluebird");
const preConditions = require("../precondition");

const ipn = (module.exports = {
  available_topics: [
    "preapproval",
    "authorized_payment",
    "payment",
    "merchant_order",
  ],
});

ipn.getPayment = requestManager.describe({
  path: "/v1/payments/:id",
  method: "GET",
});

ipn.getAuthorizedPayment = requestManager.describe({
  path: "/authorized_payments/:id",
  method: "GET",
});

/**

Manage the request obtained by the ipn endpoint
@param request
@param callback
@returns {Promise}
*/
ipn.manage = function (request, callback) {
  callback = preConditions.getCallback(callback);
  return new Promise((resolve, reject) => {
    const id = request.query.id;
    const topic = request.query.topic;
    let mpResponse;
    let mpError;

    if (this.available_topics.indexOf(topic) !== -1) {
      this[topic](id)
        .then((response) => {
          mpResponse = new MercadopagoIpnResponse(
            id,
            topic,
            response.status,
            response.body
          );
          resolve(mpResponse);
          callback(null, mpResponse);
        })
        .catch((err) => {
          reject(err);
          callback(err, null);
        });
    } else {
      mpError = new Error(
        "Invalid Topic (" +
          topic +
          "). The topics available are: " +
          this.available_topics.join(", ")
      );
      reject(mpError);
      callback(mpError, null);
    }
  });
};

ipn.payment = function (id) {
  return this.getPayment(id);
};

ipn.authorized_payment = function (id) {
  return this.getAuthorizedPayment(id);
};

ipn.preapproval = function (id) {
  return preapprovalModule.get(id);
};

ipn.merchant_order = function (id) {
  return merchantOrdersModule.get(id);
};
