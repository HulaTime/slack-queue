import { TextObject } from '../compositionObjects/TextObject';

import Block from './Block';

export type SlackSectionBlock = {
  type: string;
  text: TextObject;
  block_id: string;
}

export default class SectionBlock extends Block<SlackSectionBlock> {
  text: TextObject;

  /** Required if no text is provided. An array of text objects. Any text objects included with
    * fields will be rendered in a compact format that allows for 2 columns of side-by-side text.
    * Maximum number of items is 10. Maximum length for the text in each item is 2000 characters. 
  */
  fields?: Array<TextObject>;

  accessory?: Record<string, unknown>;

  constructor(text: TextObject) {
    super('section');
    this.text = text;
  }

  render(): SlackSectionBlock {
    return {
      type: this.type,
      block_id: this.blockId,
      text: this.text,
    };
  }
};
