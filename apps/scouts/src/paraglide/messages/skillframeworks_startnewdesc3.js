/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Startnewdesc3Inputs */

const en_skillframeworks_startnewdesc3 = /** @type {(inputs: Skillframeworks_Startnewdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Start a new framework. You can add skills manually or import a file after creating it.`)
};

const es_skillframeworks_startnewdesc3 = /** @type {(inputs: Skillframeworks_Startnewdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comienza un nuevo marco. Puedes añadir habilidades manualmente o importar un archivo después de crearlo.`)
};

const fr_skillframeworks_startnewdesc3 = /** @type {(inputs: Skillframeworks_Startnewdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Commencez un nouveau cadre. Vous pouvez ajouter des compétences manuellement ou importer un fichier après l'avoir créé.`)
};

const ar_skillframeworks_startnewdesc3 = /** @type {(inputs: Skillframeworks_Startnewdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ابدأ إطاراً جديداً. يمكنك إضافة المهارات يدوياً أو استيراد ملف بعد إنشائه.`)
};

/**
* | output |
* | --- |
* | "Start a new framework. You can add skills manually or import a file after creating it." |
*
* @param {Skillframeworks_Startnewdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_startnewdesc3 = /** @type {((inputs?: Skillframeworks_Startnewdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Startnewdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_startnewdesc3(inputs)
	if (locale === "es") return es_skillframeworks_startnewdesc3(inputs)
	if (locale === "fr") return fr_skillframeworks_startnewdesc3(inputs)
	return ar_skillframeworks_startnewdesc3(inputs)
});
export { skillframeworks_startnewdesc3 as "skillFrameworks.startNewDesc" }