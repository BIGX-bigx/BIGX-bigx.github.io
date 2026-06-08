---
layout: page
title: Profile
description: "个人经历、项目和联系方式。"
permalink: /profile/
wide: true
---

<section class="profile-grid">
  <aside class="profile-card">
    <img class="avatar" src="{{ site.author.avatar }}" alt="BIGX avatar">
    <h2>BIGX</h2>
    <p>CTF / 安全学习 / 比赛复现</p>
    <a class="button full" href="{{ site.author.github }}">GitHub</a>
  </aside>

  <div class="profile-main resume-panel">
    <div class="resume-head">
      <h2>BIGX</h2>
      <div class="resume-contact">
        <span>GitHub：<a href="{{ site.author.github }}">BIGX-bigx</a></span>
        <span>Blog：<a href="{{ '/' | relative_url }}">bigx-bigx.github.io</a></span>
      </div>
    </div>

    <section class="resume-section">
      <h2>个人信息</h2>
      <ul>
        <li>方向：Web 安全、CTF、比赛复现与安全学习记录</li>
        <li>博客用途：整理个人经历、学习笔记、项目记录和比赛 Writeup</li>
        <li>长期目标：形成稳定、可检索、可复盘的个人知识库</li>
      </ul>
    </section>

    <section class="resume-section">
      <h2>教育 / 学习经历</h2>
      <ul>
        <li><strong>安全学习方向</strong>：Web 漏洞原理、代码审计、CTF 题目复现</li>
        <li><strong>学习方式</strong>：比赛复盘、漏洞环境复现、文章归档、工具链整理</li>
      </ul>
    </section>

    <section class="resume-section">
      <h2>比赛 / 实践经历</h2>
      <ul>
        <li><strong>CTF 与安全练习</strong></li>
      </ul>
      <p>
        记录参加比赛、复现题目、分析漏洞利用链和总结解题过程。后续可以把具体比赛名称、
        时间、方向和成绩补充到这里。
      </p>
    </section>

    <section class="resume-section">
      <h2>项目经历</h2>
      <ul>
        <li><strong>个人静态博客</strong></li>
      </ul>
      <p>
        基于 GitHub Pages 与 Jekyll 搭建，用于发布 Profile、分类文章、标签归档和比赛复现内容。
      </p>
    </section>

    <section class="resume-section">
      <h2>技能清单</h2>
      <ul class="skill-list">
        <li><span>Web 安全</span><span>★★★</span></li>
        <li><span>CTF Writeup</span><span>★★★</span></li>
        <li><span>Python / 脚本</span><span>★★☆</span></li>
        <li><span>Linux / Git</span><span>★★☆</span></li>
        <li><span>Markdown / Jekyll</span><span>★★☆</span></li>
      </ul>
    </section>
  </div>
</section>
