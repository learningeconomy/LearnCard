/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Chapi_Connecthandler1Inputs */

const en_chapi_connecthandler1 = /** @type {(inputs: Chapi_Connecthandler1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect Handler`)
};

const es_chapi_connecthandler1 = /** @type {(inputs: Chapi_Connecthandler1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conectar gestor`)
};

const fr_chapi_connecthandler1 = /** @type {(inputs: Chapi_Connecthandler1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connecter le gestionnaire`)
};

const ar_chapi_connecthandler1 = /** @type {(inputs: Chapi_Connecthandler1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ربط المعالج`)
};

/**
* | output |
* | --- |
* | "Connect Handler" |
*
* @param {Chapi_Connecthandler1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const chapi_connecthandler1 = /** @type {((inputs?: Chapi_Connecthandler1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Chapi_Connecthandler1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_chapi_connecthandler1(inputs)
	if (locale === "es") return es_chapi_connecthandler1(inputs)
	if (locale === "fr") return fr_chapi_connecthandler1(inputs)
	return ar_chapi_connecthandler1(inputs)
});
export { chapi_connecthandler1 as "chapi.connectHandler" }