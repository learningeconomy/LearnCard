/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Dashboard_Currentgoal_Duetoday2Inputs */

const en_dashboard_currentgoal_duetoday2 = /** @type {(inputs: Dashboard_Currentgoal_Duetoday2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} due today`)
};

const es_dashboard_currentgoal_duetoday2 = /** @type {(inputs: Dashboard_Currentgoal_Duetoday2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} para hoy`)
};

const fr_dashboard_currentgoal_duetoday2 = /** @type {(inputs: Dashboard_Currentgoal_Duetoday2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} pour aujourd'hui`)
};

const ar_dashboard_currentgoal_duetoday2 = /** @type {(inputs: Dashboard_Currentgoal_Duetoday2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} مستحقة اليوم`)
};

/**
* | output |
* | --- |
* | "{count} due today" |
*
* @param {Dashboard_Currentgoal_Duetoday2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_currentgoal_duetoday2 = /** @type {((inputs: Dashboard_Currentgoal_Duetoday2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Currentgoal_Duetoday2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_currentgoal_duetoday2(inputs)
	if (locale === "es") return es_dashboard_currentgoal_duetoday2(inputs)
	if (locale === "fr") return fr_dashboard_currentgoal_duetoday2(inputs)
	return ar_dashboard_currentgoal_duetoday2(inputs)
});
export { dashboard_currentgoal_duetoday2 as "dashboard.currentGoal.dueToday" }