/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Gameaccess_Success2Inputs */

const en_consentflow_gameaccess_success2 = /** @type {(inputs: Consentflow_Gameaccess_Success2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You now have access!`)
};

const es_consentflow_gameaccess_success2 = /** @type {(inputs: Consentflow_Gameaccess_Success2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Ya tienes acceso!`)
};

const fr_consentflow_gameaccess_success2 = /** @type {(inputs: Consentflow_Gameaccess_Success2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez maintenant accès !`)
};

const ar_consentflow_gameaccess_success2 = /** @type {(inputs: Consentflow_Gameaccess_Success2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لديك الآن حق الوصول!`)
};

/**
* | output |
* | --- |
* | "You now have access!" |
*
* @param {Consentflow_Gameaccess_Success2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_gameaccess_success2 = /** @type {((inputs?: Consentflow_Gameaccess_Success2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Gameaccess_Success2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_gameaccess_success2(inputs)
	if (locale === "es") return es_consentflow_gameaccess_success2(inputs)
	if (locale === "fr") return fr_consentflow_gameaccess_success2(inputs)
	return ar_consentflow_gameaccess_success2(inputs)
});
export { consentflow_gameaccess_success2 as "consentFlow.gameAccess.success" }