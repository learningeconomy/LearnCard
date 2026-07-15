/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Stayintheloop3Inputs */

const en_notifications_stayintheloop3 = /** @type {(inputs: Notifications_Stayintheloop3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stay in the Loop?`)
};

const es_notifications_stayintheloop3 = /** @type {(inputs: Notifications_Stayintheloop3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Mantenerte al tanto?`)
};

const fr_notifications_stayintheloop3 = /** @type {(inputs: Notifications_Stayintheloop3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restez informé ?`)
};

const ar_notifications_stayintheloop3 = /** @type {(inputs: Notifications_Stayintheloop3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stay in the Loop?`)
};

/**
* | output |
* | --- |
* | "Stay in the Loop?" |
*
* @param {Notifications_Stayintheloop3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_stayintheloop3 = /** @type {((inputs?: Notifications_Stayintheloop3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Stayintheloop3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_stayintheloop3(inputs)
	if (locale === "es") return es_notifications_stayintheloop3(inputs)
	if (locale === "fr") return fr_notifications_stayintheloop3(inputs)
	return ar_notifications_stayintheloop3(inputs)
});
export { notifications_stayintheloop3 as "notifications.stayInTheLoop" }