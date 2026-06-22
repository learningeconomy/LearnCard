/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Connectinghandler1Inputs */

const en_profile_connectinghandler1 = /** @type {(inputs: Profile_Connectinghandler1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect Handler`)
};

const es_profile_connectinghandler1 = /** @type {(inputs: Profile_Connectinghandler1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conectar controlador`)
};

const fr_profile_connectinghandler1 = /** @type {(inputs: Profile_Connectinghandler1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionnaire de connexion`)
};

const ar_profile_connectinghandler1 = /** @type {(inputs: Profile_Connectinghandler1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ربط المعالج`)
};

/**
* | output |
* | --- |
* | "Connect Handler" |
*
* @param {Profile_Connectinghandler1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_connectinghandler1 = /** @type {((inputs?: Profile_Connectinghandler1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Connectinghandler1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_connectinghandler1(inputs)
	if (locale === "es") return es_profile_connectinghandler1(inputs)
	if (locale === "fr") return fr_profile_connectinghandler1(inputs)
	return ar_profile_connectinghandler1(inputs)
});
export { profile_connectinghandler1 as "profile.connectingHandler" }