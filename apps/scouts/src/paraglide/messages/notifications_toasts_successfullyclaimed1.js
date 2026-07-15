/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Toasts_Successfullyclaimed1Inputs */

const en_notifications_toasts_successfullyclaimed1 = /** @type {(inputs: Notifications_Toasts_Successfullyclaimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Successfully claimed Credential!`)
};

const es_notifications_toasts_successfullyclaimed1 = /** @type {(inputs: Notifications_Toasts_Successfullyclaimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Credencial reclamada exitosamente!`)
};

const fr_notifications_toasts_successfullyclaimed1 = /** @type {(inputs: Notifications_Toasts_Successfullyclaimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Justificatif réclamé avec succès !`)
};

const ar_notifications_toasts_successfullyclaimed1 = /** @type {(inputs: Notifications_Toasts_Successfullyclaimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Successfully claimed Credential!`)
};

/**
* | output |
* | --- |
* | "Successfully claimed Credential!" |
*
* @param {Notifications_Toasts_Successfullyclaimed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_toasts_successfullyclaimed1 = /** @type {((inputs?: Notifications_Toasts_Successfullyclaimed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Toasts_Successfullyclaimed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_toasts_successfullyclaimed1(inputs)
	if (locale === "es") return es_notifications_toasts_successfullyclaimed1(inputs)
	if (locale === "fr") return fr_notifications_toasts_successfullyclaimed1(inputs)
	return ar_notifications_toasts_successfullyclaimed1(inputs)
});
export { notifications_toasts_successfullyclaimed1 as "notifications.toasts.successfullyClaimed" }