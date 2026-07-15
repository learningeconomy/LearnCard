/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Noconnections4Inputs */

const en_boostcms_noconnections4 = /** @type {(inputs: Boostcms_Noconnections4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No connections yet`)
};

const es_boostcms_noconnections4 = /** @type {(inputs: Boostcms_Noconnections4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún sin conexiones`)
};

const fr_boostcms_noconnections4 = /** @type {(inputs: Boostcms_Noconnections4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune connexion pour l'instant`)
};

const ar_boostcms_noconnections4 = /** @type {(inputs: Boostcms_Noconnections4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد اتصالات بعد`)
};

/**
* | output |
* | --- |
* | "No connections yet" |
*
* @param {Boostcms_Noconnections4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_noconnections4 = /** @type {((inputs?: Boostcms_Noconnections4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Noconnections4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_noconnections4(inputs)
	if (locale === "es") return es_boostcms_noconnections4(inputs)
	if (locale === "fr") return fr_boostcms_noconnections4(inputs)
	return ar_boostcms_noconnections4(inputs)
});
export { boostcms_noconnections4 as "boostCMS.noConnections" }