/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ error: NonNullable<unknown> }} Toasts_Launchpad_Installfailed1Inputs */

const en_toasts_launchpad_installfailed1 = /** @type {(inputs: Toasts_Launchpad_Installfailed1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Failed to install app: ${i?.error}`)
};

const es_toasts_launchpad_installfailed1 = /** @type {(inputs: Toasts_Launchpad_Installfailed1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error al instalar la app: ${i?.error}`)
};

const fr_toasts_launchpad_installfailed1 = /** @type {(inputs: Toasts_Launchpad_Installfailed1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Échec de l'installation de l'app : ${i?.error}`)
};

const ar_toasts_launchpad_installfailed1 = /** @type {(inputs: Toasts_Launchpad_Installfailed1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`فشل تثبيت التطبيق: ${i?.error}`)
};

/**
* | output |
* | --- |
* | "Failed to install app: {error}" |
*
* @param {Toasts_Launchpad_Installfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_launchpad_installfailed1 = /** @type {((inputs: Toasts_Launchpad_Installfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Launchpad_Installfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_launchpad_installfailed1(inputs)
	if (locale === "es") return es_toasts_launchpad_installfailed1(inputs)
	if (locale === "fr") return fr_toasts_launchpad_installfailed1(inputs)
	return ar_toasts_launchpad_installfailed1(inputs)
});
export { toasts_launchpad_installfailed1 as "toasts.launchpad.installFailed" }