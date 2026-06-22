/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Installfailed2Inputs */

const en_appinstall_installfailed2 = /** @type {(inputs: Appinstall_Installfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to install app, please try again.`)
};

const es_appinstall_installfailed2 = /** @type {(inputs: Appinstall_Installfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo instalar la aplicación, inténtalo de nuevo.`)
};

const fr_appinstall_installfailed2 = /** @type {(inputs: Appinstall_Installfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'installer l'application, veuillez réessayer.`)
};

const ar_appinstall_installfailed2 = /** @type {(inputs: Appinstall_Installfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذّر تثبيت التطبيق، يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Unable to install app, please try again." |
*
* @param {Appinstall_Installfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_installfailed2 = /** @type {((inputs?: Appinstall_Installfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Installfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_installfailed2(inputs)
	if (locale === "es") return es_appinstall_installfailed2(inputs)
	if (locale === "fr") return fr_appinstall_installfailed2(inputs)
	return ar_appinstall_installfailed2(inputs)
});
export { appinstall_installfailed2 as "appInstall.installFailed" }