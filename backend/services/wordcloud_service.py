import base64
import io
from typing import Iterable

import nltk
from nltk.corpus import stopwords
from wordcloud import STOPWORDS, WordCloud


nltk.download("stopwords", quiet=True)


def generate_word_cloud_base64(comments: Iterable[str]) -> str:
    words = [comment.strip() for comment in comments if comment and comment.strip()]
    if not words:
        raise ValueError("Cannot generate a word cloud from empty comments.")

    combined_text = " ".join(words)
    nltk_stopwords = set(stopwords.words("english"))
    custom_stopwords = set(STOPWORDS).union(nltk_stopwords).union(
        {"mca", "india", "section", "rule", "act", "draft", "provision"}
    )
    word_cloud = WordCloud(
        width=1400,
        height=700,
        background_color="white",
        stopwords=custom_stopwords,
        collocations=False,
    ).generate(combined_text)

    image_buffer = io.BytesIO()
    word_cloud.to_image().save(image_buffer, format="PNG")
    return base64.b64encode(image_buffer.getvalue()).decode("utf-8")
