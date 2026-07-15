/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Settingnewboosts2Inputs */

const en_notifications_settingnewboosts2 = /** @type {(inputs: Notifications_Settingnewboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Boosts`)
};

const es_notifications_settingnewboosts2 = /** @type {(inputs: Notifications_Settingnewboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevos Boosts`)
};

const fr_notifications_settingnewboosts2 = /** @type {(inputs: Notifications_Settingnewboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveaux Boosts`)
};

const ar_notifications_settingnewboosts2 = /** @type {(inputs: Notifications_Settingnewboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Boosts`)
};

/**
* | output |
* | --- |
* | "New Boosts" |
*
* @param {Notifications_Settingnewboosts2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_settingnewboosts2 = /** @type {((inputs?: Notifications_Settingnewboosts2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Settingnewboosts2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_settingnewboosts2(inputs)
	if (locale === "es") return es_notifications_settingnewboosts2(inputs)
	if (locale === "fr") return fr_notifications_settingnewboosts2(inputs)
	return ar_notifications_settingnewboosts2(inputs)
});
export { notifications_settingnewboosts2 as "notifications.settingNewBoosts" }