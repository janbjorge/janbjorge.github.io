---
layout: default
title: Blog
---

{% include hero.html %}

<section class="page-section">
  <span class="eyebrow">Posts</span>
  <ul class="post-list">
  {% for post in site.posts %}
    <li>
      <span class="eyebrow">{{ post.date | date: "%B %-d, %Y" }}</span>
      <a class="post-title" href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <p class="post-excerpt">{{ post.excerpt | strip_html | strip_newlines | truncate: 160 }}</p>
    </li>
  {% endfor %}
  </ul>
</section>
