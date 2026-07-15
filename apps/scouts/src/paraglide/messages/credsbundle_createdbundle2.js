/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Createdbundle2Inputs */

const en_credsbundle_createdbundle2 = /** @type {(inputs: Credsbundle_Createdbundle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created Boost Bundle`)
};

const es_credsbundle_createdbundle2 = /** @type {(inputs: Credsbundle_Createdbundle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paquete de Boost Creado`)
};

const fr_credsbundle_createdbundle2 = /** @type {(inputs: Credsbundle_Createdbundle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ensemble de Boosts créé`)
};

const ar_credsbundle_createdbundle2 = /** @type {(inputs: Credsbundle_Createdbundle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created Boost Bundle`)
};

/**
* | output |
* | --- |
* | "Created Boost Bundle" |
*
* @param {Credsbundle_Createdbundle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_createdbundle2 = /** @type {((inputs?: Credsbundle_Createdbundle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Createdbundle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_createdbundle2(inputs)
	if (locale === "es") return es_credsbundle_createdbundle2(inputs)
	if (locale === "fr") return fr_credsbundle_createdbundle2(inputs)
	return ar_credsbundle_createdbundle2(inputs)
});
export { credsbundle_createdbundle2 as "credsBundle.createdBundle" }