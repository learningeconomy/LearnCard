/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Backbutton1Inputs */

const en_notifications_backbutton1 = /** @type {(inputs: Notifications_Backbutton1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back button`)
};

const es_notifications_backbutton1 = /** @type {(inputs: Notifications_Backbutton1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Botón de retroceso`)
};

const fr_notifications_backbutton1 = /** @type {(inputs: Notifications_Backbutton1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bouton retour`)
};

const ar_notifications_backbutton1 = /** @type {(inputs: Notifications_Backbutton1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`زر الرجوع`)
};

/**
* | output |
* | --- |
* | "Back button" |
*
* @param {Notifications_Backbutton1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_backbutton1 = /** @type {((inputs?: Notifications_Backbutton1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Backbutton1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_backbutton1(inputs)
	if (locale === "es") return es_notifications_backbutton1(inputs)
	if (locale === "fr") return fr_notifications_backbutton1(inputs)
	return ar_notifications_backbutton1(inputs)
});
export { notifications_backbutton1 as "notifications.backButton" }