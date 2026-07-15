/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Details_Createdby1Inputs */

const en_troops_details_createdby1 = /** @type {(inputs: Troops_Details_Createdby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created by {name}`)
};

const es_troops_details_createdby1 = /** @type {(inputs: Troops_Details_Createdby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creado por {name}`)
};

const fr_troops_details_createdby1 = /** @type {(inputs: Troops_Details_Createdby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créé par {name}`)
};

const ar_troops_details_createdby1 = /** @type {(inputs: Troops_Details_Createdby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشأه {name}`)
};

/**
* | output |
* | --- |
* | "Created by {name}" |
*
* @param {Troops_Details_Createdby1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_details_createdby1 = /** @type {((inputs?: Troops_Details_Createdby1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Details_Createdby1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_details_createdby1(inputs)
	if (locale === "es") return es_troops_details_createdby1(inputs)
	if (locale === "fr") return fr_troops_details_createdby1(inputs)
	return ar_troops_details_createdby1(inputs)
});
export { troops_details_createdby1 as "troops.details.createdBy" }