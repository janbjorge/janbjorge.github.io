---
layout: default
title: Blog
---

# janbjorge

Notes on software, databases and things I am building.

## Posts

{% for post in site.posts %}
<article class="post-summary">
  <p class="post-date">{{ post.date | date: "%B %-d, %Y" }}</p>
  <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
  <p>{{ post.excerpt | strip_html | strip_newlines }}</p>
</article>
{% endfor %}
