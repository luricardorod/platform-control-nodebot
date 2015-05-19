/*jslint node: true, indent: 2, nomen:true */
'use strict';

module.exports = function () {
  this.Q_angle = 0.1;
  this.Q_bias = 0.3;
  this.R_measure = 0.01;

  // Reset the angle
  this.angle = 0.0;
  // Reset bias
  this.bias = 0.0;
  this.P = [[], []];

  // Since we assume that the bias is 0 and we know the starting angle (use setAngle),
  // the error covariance matrix is set like so - see:
  // http://en.wikipedia.org/wiki/Kalman_filter#Example_application.2C_technical
  this.P[0][0] = 0.0;
  this.P[0][1] = 0.0;
  this.P[1][0] = 0.0;
  this.P[1][1] = 0.0;
  // Unbiased rate calculated from the rate and the calculated bias - you
  // have to call getAngle to update the rate
  this.rate = undefined;

  this.getAngle = function (newAngle, newRate, dt) {
    // KasBot V2  -  Kalman filter module - http://www.x-firm.com/?page_id=145
    // Modified by Kristian Lauszus
    // See my blog post for more information:
    // http://blog.tkjelectronics.dk/2012/09/a-practical-approach-to-kalman-filter-and-how-to-implement-it

    // Discrete Kalman filter time update equations - Time Update ("Predict")
    // Update xhat - Project the state ahead
    /* Step 1 */
    var S, K, y, P00_temp, P01_temp;

    this.rate = newRate - this.bias;
    this.angle += dt * this.rate;

    // Update estimation error covariance - Project the error covariance ahead
    /* Step 2 */
    this.P[0][0] += dt * (dt * this.P[1][1] - this.P[0][1] - this.P[1][0] + this.Q_angle);
    this.P[0][1] -= dt * this.P[1][1];
    this.P[1][0] -= dt * this.P[1][1];
    this.P[1][1] += this.Q_bias * dt;

    // Discrete Kalman filter measurement update equations - Measurement Update ("Correct")
    // Calculate Kalman gain - Compute the Kalman gain
    /* Step 4 */
    S = this.P[0][0] + this.R_measure; // Estimate error
    /* Step 5 */
    K = []; // Kalman gain - This is a 2x1 vector
    K[0] = this.P[0][0] / S;
    K[1] = this.P[1][0] / S;

    // Calculate angle and bias - Update estimate with measurement zk (newAngle)
    /* Step 3 */
    y = newAngle - this.angle; // Angle difference
    /* Step 6 */

    this.angle += K[0] * y;
    this.bias += K[1] * y;

    // Calculate estimation error covariance - Update the error covariance
    /* Step 7 */
    P00_temp = this.P[0][0];
    P01_temp = this.P[0][1];

    this.P[0][0] -= K[0] * P00_temp;
    this.P[0][1] -= K[0] * P01_temp;
    this.P[1][0] -= K[1] * P00_temp;
    this.P[1][1] -= K[1] * P01_temp;

    return this.angle;
  };

  this.setAngle = function (newAngle) {
    this.angle = newAngle;
  };

  this.getRate  = function () {
    return this.rate;
  };

  this.setQangle = function (newQ_angle) {
    this.Q_angle = newQ_angle;
  };

  this.setQbias = function (newQ_bias) { this.Q_bias = newQ_bias; };
  this.setRmeasure = function (newR_measure) { this.R_measure = newR_measure; };
  this.getQangle = function () { return this.Q_angle; };
  this.getQbias = function () { return this.Q_bias; };
  this.getRmeasure = function () { return this.R_measure; };
};
