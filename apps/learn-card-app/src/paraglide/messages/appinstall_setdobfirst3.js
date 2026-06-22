/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Setdobfirst3Inputs */

const en_appinstall_setdobfirst3 = /** @type {(inputs: Appinstall_Setdobfirst3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please set your date of birth before installing this app.`)
};

const es_appinstall_setdobfirst3 = /** @type {(inputs: Appinstall_Setdobfirst3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Establece tu fecha de nacimiento antes de instalar esta aplicación.`)
};

const fr_appinstall_setdobfirst3 = /** @type {(inputs: Appinstall_Setdobfirst3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez définir votre date de naissance avant d'installer cette application.`)
};

const ar_appinstall_setdobfirst3 = /** @type {(inputs: Appinstall_Setdobfirst3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى تعيين تاريخ ميلادك قبل تثبيت هذا التطبيق.`)
};

/**
* | output |
* | --- |
* | "Please set your date of birth before installing this app." |
*
* @param {Appinstall_Setdobfirst3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_setdobfirst3 = /** @type {((inputs?: Appinstall_Setdobfirst3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Setdobfirst3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_setdobfirst3(inputs)
	if (locale === "es") return es_appinstall_setdobfirst3(inputs)
	if (locale === "fr") return fr_appinstall_setdobfirst3(inputs)
	return ar_appinstall_setdobfirst3(inputs)
});
export { appinstall_setdobfirst3 as "appInstall.setDobFirst" }