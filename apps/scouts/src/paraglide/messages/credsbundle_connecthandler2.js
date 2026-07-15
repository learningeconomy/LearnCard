/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Connecthandler2Inputs */

const en_credsbundle_connecthandler2 = /** @type {(inputs: Credsbundle_Connecthandler2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect Handler`)
};

const es_credsbundle_connecthandler2 = /** @type {(inputs: Credsbundle_Connecthandler2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conectar Gestor`)
};

const fr_credsbundle_connecthandler2 = /** @type {(inputs: Credsbundle_Connecthandler2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionnaire de connexion`)
};

const ar_credsbundle_connecthandler2 = /** @type {(inputs: Credsbundle_Connecthandler2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect Handler`)
};

/**
* | output |
* | --- |
* | "Connect Handler" |
*
* @param {Credsbundle_Connecthandler2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_connecthandler2 = /** @type {((inputs?: Credsbundle_Connecthandler2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Connecthandler2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_connecthandler2(inputs)
	if (locale === "es") return es_credsbundle_connecthandler2(inputs)
	if (locale === "fr") return fr_credsbundle_connecthandler2(inputs)
	return ar_credsbundle_connecthandler2(inputs)
});
export { credsbundle_connecthandler2 as "credsBundle.connectHandler" }