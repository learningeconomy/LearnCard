/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Createbundledesc3Inputs */

const en_credsbundle_createbundledesc3 = /** @type {(inputs: Credsbundle_Createbundledesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This will create a shared boost bundle that can shared and viewed.`)
};

const es_credsbundle_createbundledesc3 = /** @type {(inputs: Credsbundle_Createbundledesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esto creará un paquete de boosts compartido que se podrá compartir y ver.`)
};

const fr_credsbundle_createbundledesc3 = /** @type {(inputs: Credsbundle_Createbundledesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela créera un ensemble de Boosts partagé qui pourra être partagé et consulté.`)
};

const ar_credsbundle_createbundledesc3 = /** @type {(inputs: Credsbundle_Createbundledesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This will create a shared boost bundle that can shared and viewed.`)
};

/**
* | output |
* | --- |
* | "This will create a shared boost bundle that can shared and viewed." |
*
* @param {Credsbundle_Createbundledesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_createbundledesc3 = /** @type {((inputs?: Credsbundle_Createbundledesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Createbundledesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_createbundledesc3(inputs)
	if (locale === "es") return es_credsbundle_createbundledesc3(inputs)
	if (locale === "fr") return fr_credsbundle_createbundledesc3(inputs)
	return ar_credsbundle_createbundledesc3(inputs)
});
export { credsbundle_createbundledesc3 as "credsBundle.createBundleDesc" }