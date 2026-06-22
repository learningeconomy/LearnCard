/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categorydescriptor_Descriptions_Achievements1Inputs */

const en_wallet_categorydescriptor_descriptions_achievements1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Achievements1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Achievements are milestones or accomplishments that are earned through effort, skill, or perseverance. They signify the completion of goals, the overcoming of challenges, or the recognition of excellence in various aspects of life, including personal, professional, educational, or recreational areas. Achievements can range from academic degrees, career advancements, personal milestones, creative endeavors, to competitive victories.`)
};

const es_wallet_categorydescriptor_descriptions_achievements1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Achievements1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los logros son hitos o realizaciones que se obtienen con esfuerzo, habilidad o perseverancia. Representan el cumplimiento de objetivos, la superación de retos o el reconocimiento de la excelencia en distintos ámbitos de la vida, ya sean personales, profesionales, educativos o recreativos. Los logros pueden ir desde títulos académicos, avances profesionales e hitos personales hasta proyectos creativos o victorias en competiciones.`)
};

const fr_wallet_categorydescriptor_descriptions_achievements1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Achievements1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les réussites sont des étapes ou des accomplissements obtenus grâce à l'effort, au talent ou à la persévérance. Elles marquent l'atteinte d'objectifs, le dépassement de défis ou la reconnaissance de l'excellence dans divers aspects de la vie, qu'ils soient personnels, professionnels, éducatifs ou récréatifs. Les réussites peuvent aller des diplômes académiques, des avancées de carrière et des étapes personnelles aux projets créatifs ou aux victoires en compétition.`)
};

const ar_wallet_categorydescriptor_descriptions_achievements1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Achievements1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإنجازات هي محطات أو منجزات تُكتسب من خلال الجهد أو المهارة أو المثابرة. وهي تدل على تحقيق الأهداف أو تجاوز التحديات أو الاعتراف بالتميّز في جوانب مختلفة من الحياة، سواء كانت شخصية أو مهنية أو تعليمية أو ترفيهية. ويمكن أن تتراوح الإنجازات بين الشهادات الأكاديمية والترقيات المهنية والمحطات الشخصية وصولاً إلى المشاريع الإبداعية أو الانتصارات التنافسية.`)
};

/**
* | output |
* | --- |
* | "Achievements are milestones or accomplishments that are earned through effort, skill, or perseverance. They signify the completion of goals, the overcoming o..." |
*
* @param {Wallet_Categorydescriptor_Descriptions_Achievements1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categorydescriptor_descriptions_achievements1 = /** @type {((inputs?: Wallet_Categorydescriptor_Descriptions_Achievements1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categorydescriptor_Descriptions_Achievements1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categorydescriptor_descriptions_achievements1(inputs)
	if (locale === "es") return es_wallet_categorydescriptor_descriptions_achievements1(inputs)
	if (locale === "fr") return fr_wallet_categorydescriptor_descriptions_achievements1(inputs)
	return ar_wallet_categorydescriptor_descriptions_achievements1(inputs)
});
export { wallet_categorydescriptor_descriptions_achievements1 as "wallet.categoryDescriptor.descriptions.achievements" }