import spacy

#Load the SpaCy model:
nlp = spacy.load("en_core_web_sm")

#Generate a preprocessing
def preprocess (options, categories, best_decision, main_consideration, choice_considerations):
    
    # Extract text from categories and choice_considerations
    category_titles = [category['title'] for category in categories]
    choice_consideration_texts = [consideration.get('consideration', '') for consideration in choice_considerations]

    data = " ".join(options + category_titles + [best_decision, main_consideration] + choice_consideration_texts)
  
    doc = nlp(data)

    #Extract and return text
    processed_text = " ".join([token.text for token in doc])
    
    return processed_text

