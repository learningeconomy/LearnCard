/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Creatingbundle2Inputs */

const en_credsbundle_creatingbundle2 = /** @type {(inputs: Credsbundle_Creatingbundle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creating your boost bundle....`)
};

const es_credsbundle_creatingbundle2 = /** @type {(inputs: Credsbundle_Creatingbundle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creando tu paquete de boosts...`)
};

const fr_credsbundle_creatingbundle2 = /** @type {(inputs: Credsbundle_Creatingbundle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création de votre ensemble de Boosts...`)
};

const ar_credsbundle_creatingbundle2 = /** @type {(inputs: Credsbundle_Creatingbundle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creating your boost bundle....`)
};

/**
* | output |
* | --- |
* | "Creating your boost bundle...." |
*
* @param {Credsbundle_Creatingbundle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_creatingbundle2 = /** @type {((inputs?: Credsbundle_Creatingbundle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Creatingbundle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_creatingbundle2(inputs)
	if (locale === "es") return es_credsbundle_creatingbundle2(inputs)
	if (locale === "fr") return fr_credsbundle_creatingbundle2(inputs)
	return ar_credsbundle_creatingbundle2(inputs)
});
export { credsbundle_creatingbundle2 as "credsBundle.creatingBundle" }