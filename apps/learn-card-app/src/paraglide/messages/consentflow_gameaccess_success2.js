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

const de_consentflow_gameaccess_success2 = /** @type {(inputs: Consentflow_Gameaccess_Success2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Du hast jetzt Zugang!`)
};

const ar_consentflow_gameaccess_success2 = /** @type {(inputs: Consentflow_Gameaccess_Success2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لديك الآن حق الوصول!`)
};

const fr_consentflow_gameaccess_success2 = /** @type {(inputs: Consentflow_Gameaccess_Success2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez maintenant accès !`)
};

const ko_consentflow_gameaccess_success2 = /** @type {(inputs: Consentflow_Gameaccess_Success2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이제 액세스할 수 있습니다!`)
};

/**
* | output |
* | --- |
* | "You now have access!" |
*
* @param {Consentflow_Gameaccess_Success2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_gameaccess_success2 = /** @type {((inputs?: Consentflow_Gameaccess_Success2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Gameaccess_Success2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_gameaccess_success2(inputs)
	if (locale === "es") return es_consentflow_gameaccess_success2(inputs)
	if (locale === "de") return de_consentflow_gameaccess_success2(inputs)
	if (locale === "ar") return ar_consentflow_gameaccess_success2(inputs)
	if (locale === "fr") return fr_consentflow_gameaccess_success2(inputs)
	return ko_consentflow_gameaccess_success2(inputs)
});
export { consentflow_gameaccess_success2 as "consentFlow.gameAccess.success" }