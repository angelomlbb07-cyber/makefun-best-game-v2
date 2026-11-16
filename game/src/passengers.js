// DUSKFERRY v2 — passengers: the three waiting at the west dock and the
// trade-off each one carries. The world asks this module who is waiting,
// what boarding one means, and what a delivery pays.

import { PASSENGERS, PASSENGER_SPOTS } from './config.js';

// Pick three distinct passengers for a crossing, in dock order (top to
// bottom). The order is shuffled per crossing so no crossing always offers
// the same passenger at the same height.
export function drawPassengers(random) {
  const pool = PASSENGERS.slice();
  const out = [];
  while (pool.length > 0) {
    const i = Math.floor(random.next() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out.map((p, i) => ({ ...p, y: PASSENGER_SPOTS[i] }));
}

// The quota a passenger needs: the keeper's lanterns count double, so the
// far dock asks for half (rounded up).
export function quotaFor(passenger, quota) {
  if (passenger && passenger.key === 'keeper') return Math.ceil(quota / 2);
  return quota;
}

// What a delivery pays before the difficulty multiplier and the combo
// bonus: the passenger's pay, or the ruined-parcel pay if the courier
// took a hit while aboard.
export function deliveryPay(passenger, parcelRuined) {
  if (!passenger) return 0;
  if (passenger.key === 'courier' && parcelRuined) return 40;
  return passenger.pay;
}
